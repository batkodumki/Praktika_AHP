"""
Admin configuration for comparisons app.
"""
from django.contrib import admin
from .models import Project, Comparison, Result


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'status', 'created_at', 'updated_at']
    list_filter = ['status', 'scale_type', 'created_at']
    search_fields = ['title', 'description', 'user__username']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Comparison)
class ComparisonAdmin(admin.ModelAdmin):
    list_display = ['project', 'index_a', 'index_b', 'value', 'direction', 'reliability']
    list_filter = ['direction', 'created_at']
    search_fields = ['project__title']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Result)
class ResultAdmin(admin.ModelAdmin):
    list_display = ['project', 'is_consistent', 'consistency_ratio', 'lambda_max', 'created_at']
    list_filter = ['is_consistent', 'created_at']
    search_fields = ['project__title']
    readonly_fields = ['created_at', 'updated_at']
