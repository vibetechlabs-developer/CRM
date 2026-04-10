# Generated manually

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("tickets", "0015_ticket_discarded_at"),
    ]

    operations = [
        migrations.CreateModel(
            name="DiscardReopenReminderDismissal",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "ticket",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="discard_reopen_reminder_dismissals",
                        to="tickets.ticket",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="discard_reopen_reminder_dismissals",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
        migrations.AddConstraint(
            model_name="discardreopenreminderdismissal",
            constraint=models.UniqueConstraint(
                fields=("user", "ticket"),
                name="uniq_discard_reopen_reminder_user_ticket",
            ),
        ),
    ]
