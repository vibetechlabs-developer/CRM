# Scope dismissals per anniversary season (reminder can return next year)

from django.db import migrations, models


def backfill_anniversary(apps, schema_editor):
    DiscardReopenReminderDismissal = apps.get_model("tickets", "DiscardReopenReminderDismissal")
    Ticket = apps.get_model("tickets", "Ticket")

    def add_one_year(d):
        try:
            return d.replace(year=d.year + 1)
        except ValueError:
            return d.replace(year=d.year + 1, month=2, day=28)

    for row in DiscardReopenReminderDismissal.objects.filter(reminder_anniversary_on__isnull=True).select_related(
        "ticket"
    ):
        t = row.ticket
        if t.discarded_at:
            d = t.discarded_at.date() if hasattr(t.discarded_at, "date") else t.discarded_at
            row.reminder_anniversary_on = add_one_year(d)
        else:
            row.reminder_anniversary_on = row.created_at.date()
        row.save(update_fields=["reminder_anniversary_on"])


class Migration(migrations.Migration):

    dependencies = [
        ("tickets", "0016_discardreopenreminderdismissal"),
    ]

    operations = [
        migrations.RemoveConstraint(
            model_name="discardreopenreminderdismissal",
            name="uniq_discard_reopen_reminder_user_ticket",
        ),
        migrations.AddField(
            model_name="discardreopenreminderdismissal",
            name="reminder_anniversary_on",
            field=models.DateField(null=True),
        ),
        migrations.RunPython(backfill_anniversary, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="discardreopenreminderdismissal",
            name="reminder_anniversary_on",
            field=models.DateField(),
        ),
        migrations.AddConstraint(
            model_name="discardreopenreminderdismissal",
            constraint=models.UniqueConstraint(
                fields=("user", "ticket", "reminder_anniversary_on"),
                name="uniq_discard_reopen_reminder_user_ticket_anniv",
            ),
        ),
    ]
