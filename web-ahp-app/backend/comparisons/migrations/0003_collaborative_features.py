# Generated manually for collaborative expert decision-making features

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("comparisons", "0002_comparison_gradations_comparison_refinement_level_and_more"),
    ]

    operations = [
        # Add is_collaborative field to Project
        migrations.AddField(
            model_name="project",
            name="is_collaborative",
            field=models.BooleanField(default=False),
        ),

        # Create ProjectCollaborator model
        migrations.CreateModel(
            name="ProjectCollaborator",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "role",
                    models.CharField(
                        choices=[("owner", "Owner"), ("contributor", "Contributor")],
                        default="contributor",
                        max_length=20,
                    ),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("invited", "Invited"),
                            ("active", "Active"),
                            ("completed", "Completed"),
                        ],
                        default="invited",
                        max_length=20,
                    ),
                ),
                ("invited_at", models.DateTimeField(auto_now_add=True)),
                ("completed_at", models.DateTimeField(blank=True, null=True)),
                (
                    "project",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="collaborators",
                        to="comparisons.project",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["invited_at"],
                "unique_together": {("project", "user")},
            },
        ),

        # Add user field to Comparison (for multi-user support)
        migrations.AddField(
            model_name="comparison",
            name="user",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                to=settings.AUTH_USER_MODEL,
            ),
        ),

        # Create AggregatedResult model
        migrations.CreateModel(
            name="AggregatedResult",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "aggregation_method",
                    models.CharField(
                        choices=[
                            ("AIJ", "Aggregation of Individual Judgments"),
                            ("AIP", "Aggregation of Individual Priorities"),
                        ],
                        default="AIJ",
                        max_length=20,
                    ),
                ),
                ("num_experts", models.IntegerField()),
                ("aggregated_matrix", models.JSONField()),
                ("final_weights", models.JSONField()),
                ("expert_weights", models.JSONField(default=dict)),
                ("consistency_ratio", models.FloatField()),
                ("lambda_max", models.FloatField(blank=True, null=True)),
                ("consistency_index", models.FloatField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "project",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="aggregated_results",
                        to="comparisons.project",
                    ),
                ),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
    ]
