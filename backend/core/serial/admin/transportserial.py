from rest_framework import serializers
from core.models import Route, Bus, BusFee, BusAssignment
from core.models import Student, AcademicSession

class RouteSerializer(serializers.ModelSerializer):
    number_of_students = serializers.SerializerMethodField()

    class Meta:
        model = Route
        fields = ['id', 'name', 'description', 'stops', 'number_of_students']

    def get_number_of_students(self, obj):
        return obj.assignments.filter(is_active=True).count()

class BusSerializer(serializers.ModelSerializer):
    routes = RouteSerializer(many=True, read_only=True)
    route_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Route.objects.all(), source='routes', write_only=True
    )

    class Meta:
        model = Bus
        fields = [
            'id', 'bus_number', 'registration_number', 'model', 'capacity',
            'driver_name', 'driver_contact', 'routes', 'route_ids',
            'status', 'last_serviced'
        ]

class BusFeeSerializer(serializers.ModelSerializer):
    route = serializers.PrimaryKeyRelatedField(queryset=Route.objects.all())
    academic_session = serializers.PrimaryKeyRelatedField(
        queryset=AcademicSession.objects.all()
    )

    class Meta:
        model = BusFee
        fields = ['id', 'route', 'academic_session', 'default_amount']

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['route'] = RouteSerializer(instance.route).data
        representation['academic_session'] = {
            'id': instance.academic_session.id,
            'name': instance.academic_session.name
        }
        return representation

class BusAssignmentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.user.name', read_only=True)
    student = serializers.PrimaryKeyRelatedField(queryset=Student.objects.all())
    route = serializers.PrimaryKeyRelatedField(queryset=Route.objects.all())
    bus = serializers.PrimaryKeyRelatedField(queryset=Bus.objects.all(), required=False, allow_null=True)
    academic_session = serializers.PrimaryKeyRelatedField(queryset=AcademicSession.objects.all())
    stop = serializers.CharField(max_length=100, required=True, allow_blank=False, error_messages={'blank': 'Stop cannot be empty.'})

    class Meta:
        model = BusAssignment
        fields = [
            'id', 'student', 'student_name', 'route', 'bus', 'stop',
            'custom_fee', 'academic_session', 'is_active', 'assigned_at', 'revoked_at', 'remarks'
        ]
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['route'] = RouteSerializer(instance.route).data
        if instance.bus:
            representation['bus'] = BusSerializer(instance.bus).data
        representation['academic_session'] = {
            'id': instance.academic_session.id,
            'name': instance.academic_session.name
        }
        representation['student'] = {
            'id': instance.student.id,
            'user_name': instance.student.user.name
        }
        return representation

    def validate(self, data):
        # When creating a new assignment, a stop must be provided.
        if not self.instance and not data.get('stop'):
             raise serializers.ValidationError({"stop": "This field may not be blank."})
        if data.get('custom_fee') is not None and data['custom_fee'] < 0:
            raise serializers.ValidationError("Custom fee cannot be negative.")
        
        # Prevent same student from being assigned to multiple routes/buses
        student = data.get('student')
        academic_session = data.get('academic_session')
        
        if student and academic_session:
            existing_assignment = BusAssignment.objects.filter(
                student=student,
                academic_session=academic_session,
                is_active=True
            )
            
            # If updating, exclude current instance
            if self.instance:
                existing_assignment = existing_assignment.exclude(id=self.instance.id)
            
            if existing_assignment.exists():
                existing = existing_assignment.first()
                raise serializers.ValidationError(
                    f"Student is already assigned to route '{existing.route.name}' for this academic session."
                )
        
        return data