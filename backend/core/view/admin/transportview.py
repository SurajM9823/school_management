from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.http import HttpResponse
from django.template.loader import render_to_string
from core.models import Route, Bus, BusFee, BusAssignment, Student, AcademicSession, Class, Section
from core.serial.admin.transportserial import RouteSerializer, BusSerializer, BusFeeSerializer, BusAssignmentSerializer
from rest_framework import serializers
from django.db.models import Q, Count
import io
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.units import inch

class RouteViewSet(viewsets.ModelViewSet):
    queryset = Route.objects.all()
    serializer_class = RouteSerializer

class BusViewSet(viewsets.ModelViewSet):
    queryset = Bus.objects.all()
    serializer_class = BusSerializer

class BusFeeViewSet(viewsets.ModelViewSet):
    queryset = BusFee.objects.all()
    serializer_class = BusFeeSerializer

    @action(detail=True, methods=['get'])
    def for_route(self, request, pk=None):
        academic_session_id = request.query_params.get('academic_session_id')
        if not academic_session_id:
            return Response({"error": "academic_session_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            bus_fee = self.queryset.get(route_id=pk, academic_session_id=academic_session_id)
            serializer = self.get_serializer(bus_fee)
            return Response(serializer.data)
        except BusFee.DoesNotExist:
            return Response({"default_amount": None}, status=status.HTTP_200_OK)

class BusAssignmentViewSet(viewsets.ModelViewSet):
    queryset = BusAssignment.objects.all()
    serializer_class = BusAssignmentSerializer
    pagination_class = None

    def get_queryset(self):
        queryset = super().get_queryset()
        route_id = self.request.query_params.get('route_id')
        if route_id:
            queryset = queryset.filter(route_id=route_id)
        return queryset

    def create(self, request, *args, **kwargs):
        is_many = isinstance(request.data, list)
        if not is_many:
            return super().create(request, *args, **kwargs)
        
        serializer = self.get_serializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=False, methods=['get'])
    def students(self, request):
        class_id = request.query_params.get('class_id')
        section_id = request.query_params.get('section_id')
        
        students = Student.objects.filter(status='active')
        
        if class_id:
            students = students.filter(class_id=class_id)
        if section_id:
            students = students.filter(section=section_id)
            
        # Simple serializer to avoid dependency issues
        class StudentListSerializer(serializers.ModelSerializer):
            name = serializers.CharField(source='user.name')
            class_name = serializers.CharField(source='class_id.name')
            section_name = serializers.CharField(source='section.name')

            class Meta:
                model = Student
                fields = ['id', 'name', 'admission_number', 'class_name', 'section_name']

        serializer = StudentListSerializer(students, many=True)
        return Response(serializer.data)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        # When reactivating, clear the revoked_at timestamp
        if request.data.get('is_active') and not instance.is_active:
            request.data['revoked_at'] = None
        return super().partial_update(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def revoke(self, request, pk=None):
        assignment = self.get_object()
        if not assignment.is_active:
            return Response({"error": "Assignment is already revoked"}, status=status.HTTP_400_BAD_REQUEST)
        assignment.is_active = False
        assignment.revoked_at = timezone.now()
        assignment.save()
        return Response({"message": "Bus assignment revoked."}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def transport_report(self, request):
        academic_session_id = request.query_params.get('academic_session_id')
        if not academic_session_id:
            return Response({"error": "academic_session_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            session = AcademicSession.objects.get(id=academic_session_id)
        except AcademicSession.DoesNotExist:
            return Response({"error": "Academic session not found"}, status=status.HTTP_404_NOT_FOUND)
        
        # Get all active assignments for the session
        assignments = BusAssignment.objects.filter(
            academic_session=session,
            is_active=True
        ).select_related(
            'student__user', 'student__class_id', 'student__section',
            'route', 'bus'
        ).order_by('route__name', 'student__class_id__name', 'student__section__name', 'student__user__name')
        
        # Create PDF
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
        
        # Container for the 'Flowable' objects
        elements = []
        
        # Define styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=18,
            spaceAfter=30,
            alignment=1  # Center alignment
        )
        
        # Add title
        title = Paragraph(f"Transport Management Report<br/>Academic Session: {session.name}", title_style)
        elements.append(title)
        elements.append(Spacer(1, 20))
        
        # Summary statistics
        total_students = assignments.count()
        total_routes = assignments.values('route').distinct().count()
        total_buses = assignments.values('bus').distinct().count()
        
        summary_data = [
            ['Summary Statistics', ''],
            ['Total Students Assigned', str(total_students)],
            ['Total Routes in Use', str(total_routes)],
            ['Total Buses in Use', str(total_buses)],
        ]
        
        summary_table = Table(summary_data, colWidths=[3*inch, 2*inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        elements.append(summary_table)
        elements.append(Spacer(1, 30))
        
        # Group assignments by route
        routes_data = {}
        for assignment in assignments:
            route_name = assignment.route.name
            if route_name not in routes_data:
                routes_data[route_name] = {
                    'route': assignment.route,
                    'assignments': []
                }
            routes_data[route_name]['assignments'].append(assignment)
        
        # Create detailed report for each route
        for route_name, route_info in routes_data.items():
            route = route_info['route']
            route_assignments = route_info['assignments']
            
            # Route header
            route_title = Paragraph(f"Route: {route_name}", styles['Heading2'])
            elements.append(route_title)
            
            # Route details
            route_details = f"Stops: {', '.join(route.stops)}<br/>Total Students: {len(route_assignments)}"
            route_detail_para = Paragraph(route_details, styles['Normal'])
            elements.append(route_detail_para)
            elements.append(Spacer(1, 10))
            
            # Student table for this route
            data = [['S.No.', 'Student Name', 'Class', 'Section', 'Stop', 'Bus No.', 'Fee (NPR)']]
            
            for idx, assignment in enumerate(route_assignments, 1):
                fee = assignment.custom_fee if assignment.custom_fee else 'Default'
                bus_no = assignment.bus.bus_number if assignment.bus else 'Not Assigned'
                
                data.append([
                    str(idx),
                    assignment.student.user.name,
                    assignment.student.class_id.name if assignment.student.class_id else 'N/A',
                    assignment.student.section.name if assignment.student.section else 'N/A',
                    assignment.stop,
                    bus_no,
                    str(fee)
                ])
            
            # Create table
            table = Table(data, colWidths=[0.5*inch, 2*inch, 0.8*inch, 0.8*inch, 1.5*inch, 1*inch, 0.8*inch])
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('FONTSIZE', (0, 1), (-1, -1), 8),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ]))
            
            elements.append(table)
            elements.append(Spacer(1, 20))
        
        # Build PDF
        doc.build(elements)
        
        # Get the value of the BytesIO buffer and write it to the response
        pdf = buffer.getvalue()
        buffer.close()
        
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="transport-report-{session.name}.pdf"'
        response.write(pdf)
        
        return response
    
    @action(detail=False, methods=['get'], url_path='transport-report-data')
    def transport_report_data(self, request):
        academic_session_id = request.query_params.get('academic_session_id')
        if not academic_session_id:
            return Response({"error": "academic_session_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            session = AcademicSession.objects.get(id=academic_session_id)
        except AcademicSession.DoesNotExist:
            return Response({"error": "Academic session not found"}, status=status.HTTP_404_NOT_FOUND)
        
        # Get all active assignments for the session
        assignments = BusAssignment.objects.filter(
            academic_session=session,
            is_active=True
        ).select_related(
            'student__user', 'student__class_id', 'student__section',
            'route', 'bus'
        ).order_by('route__name', 'student__class_id__name', 'student__section__name', 'student__user__name')
        
        # Summary statistics
        total_students = assignments.count()
        total_routes = assignments.values('route').distinct().count()
        total_buses = assignments.values('bus').distinct().count()
        
        # Group assignments by route
        routes_data = {}
        for assignment in assignments:
            route_name = assignment.route.name
            if route_name not in routes_data:
                routes_data[route_name] = {
                    'name': route_name,
                    'stops': assignment.route.stops,
                    'assignments': []
                }
            
            routes_data[route_name]['assignments'].append({
                'student_name': assignment.student.user.name,
                'class_name': assignment.student.class_id.name if assignment.student.class_id else None,
                'section_name': assignment.student.section.name if assignment.student.section else None,
                'stop': assignment.stop,
                'bus_number': assignment.bus.bus_number if assignment.bus else None,
                'fee': assignment.custom_fee
            })
        
        # Convert to list format
        routes_list = list(routes_data.values())
        
        return Response({
            'session': {
                'id': session.id,
                'name': session.name
            },
            'summary': {
                'total_students': total_students,
                'total_routes': total_routes,
                'total_buses': total_buses
            },
            'routes': routes_list
        })