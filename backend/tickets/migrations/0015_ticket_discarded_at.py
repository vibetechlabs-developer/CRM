# Generated manually for discard anniversary reminders

from django.db import migrations, models
from django.db.models import F


def backfill_discarded_at(apps, schema_editor):
    Ticket = apps.get_model("tickets", "Ticket")
    Ticket.objects.filter(status="DISCARDED", discarded_at__isnull=True).update(
        discarded_at=F("updated_at")
    )


class Migration(migrations.Migration):

    dependencies = [
        ("tickets", "0014_alter_binder_people_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="ticket",
            name="discarded_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.RunPython(backfill_discarded_at, migrations.RunPython.noop),
    ]
