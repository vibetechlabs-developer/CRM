from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("tickets", "0008_notification_created_by"),
    ]

    operations = [
        migrations.AddField(
            model_name="ticket",
            name="renewal_date",
            field=models.DateField(blank=True, null=True),
        ),
    ]

