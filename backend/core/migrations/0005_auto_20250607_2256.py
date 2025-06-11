from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('core', '0004_alter_holiday_options_alter_term_options_and_more'),
    ]

    operations = [
        migrations.RunSQL(
            "ALTER TABLE core_holiday DROP COLUMN assignment_category;",
            reverse_sql="ALTER TABLE core_holiday ADD COLUMN assignment_category VARCHAR(50) NOT NULL;"
        ),
        migrations.AlterField(
            model_name='Holiday',
            name='holiday_category',
            field=models.CharField(
                max_length=50,
                choices=[
                    ('all', 'All'),
                    ('women_only', 'Women Only'),
                    ('men_only', 'Men Only'),
                    ('staff_only', 'Staff Only'),
                    ('students_only', 'Students Only'),
                ],
                default='all',
            ),
        ),
    ]