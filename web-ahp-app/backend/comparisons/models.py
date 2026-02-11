"""
Models for pairwise comparison projects.
"""
from django.db import models
from django.contrib.auth.models import User
import json


class UserProfile(models.Model):
    """Extended user profile information."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    avatar_url = models.URLField(max_length=500, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile for {self.user.username}"


class Project(models.Model):
    """A pairwise comparison project/session."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='projects')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    # Alternatives (stored as JSON array)
    alternatives = models.JSONField(default=list)

    # Scale configuration
    scale_type = models.IntegerField(
        default=1,
        choices=[
            (1, 'Integer'),
            (2, 'Balanced'),
            (3, 'Power'),
            (4, 'Ma-Zheng'),
            (5, 'Donegan'),
        ]
    )

    # Collaborative features
    is_collaborative = models.BooleanField(default=False)

    # Status
    STATUS_CHOICES = [
        ('input', 'Input Alternatives'),
        ('comparison', 'Making Comparisons'),
        ('completed', 'Completed'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='input')

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.title} - {self.user.username}"


class ProjectCollaborator(models.Model):
    """Track expert collaborators on a project."""
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='collaborators')
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    ROLE_CHOICES = [
        ('owner', 'Owner'),
        ('contributor', 'Contributor'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='contributor')

    STATUS_CHOICES = [
        ('invited', 'Invited'),
        ('active', 'Active'),
        ('completed', 'Completed'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='invited')

    invited_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ['project', 'user']
        ordering = ['invited_at']

    def __str__(self):
        return f"{self.user.username} - {self.project.title} ({self.role})"


class Comparison(models.Model):
    """A single pairwise comparison."""
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='comparisons')
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)  # For collaborative projects

    # Indices of compared alternatives
    index_a = models.IntegerField()
    index_b = models.IntegerField()

    # Comparison result (after scale transformation)
    value = models.FloatField()

    # Progressive refinement data
    direction = models.CharField(
        max_length=10,
        choices=[('more', 'More'), ('less', 'Less')]
    )  # Which alternative is more important

    reliability = models.FloatField(default=0.0)  # 0-8 scale
    scale_str = models.CharField(max_length=50, default='259')  # Current scale gradations

    # Scale configuration
    scale_type = models.IntegerField(
        default=1,
        choices=[
            (1, 'Integer'),
            (2, 'Balanced'),
            (3, 'Power'),
            (4, 'Ma-Zheng'),
            (5, 'Donegan'),
        ]
    )
    gradations = models.IntegerField(default=3)  # Number of gradations (2-8)
    refinement_level = models.IntegerField(default=0)  # Progressive refinement level (0-3)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # Allow multiple users to compare the same pair in collaborative mode
        # For single-user projects (user=NULL), multiple NULLs are allowed
        unique_together = ['project', 'user', 'index_a', 'index_b']
        ordering = ['index_a', 'index_b']

    def __str__(self):
        return f"Comparison {self.index_a} vs {self.index_b}: {self.value}"


class Result(models.Model):
    """Calculated results for a project."""
    project = models.OneToOneField(Project, on_delete=models.CASCADE, related_name='result')

    # Comparison matrix (stored as JSON)
    matrix = models.JSONField()

    # Weights (stored as JSON array)
    weights = models.JSONField()

    # Rankings (stored as JSON array)
    rankings = models.JSONField()

    # Consistency metrics
    lambda_max = models.FloatField()
    consistency_index = models.FloatField()
    consistency_ratio = models.FloatField()
    is_consistent = models.BooleanField()

    # Recommendations (stored as JSON array)
    recommendations = models.JSONField(default=list)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Results for {self.project.title}"


class AggregatedResult(models.Model):
    """Aggregated results from multiple experts."""
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='aggregated_results')

    METHOD_CHOICES = [
        ('AIJ', 'Aggregation of Individual Judgments'),
        ('AIP', 'Aggregation of Individual Priorities'),
    ]
    aggregation_method = models.CharField(max_length=20, choices=METHOD_CHOICES, default='AIJ')

    # Number of experts whose judgments were aggregated
    num_experts = models.IntegerField()

    # Aggregated comparison matrix (stored as JSON)
    aggregated_matrix = models.JSONField()

    # Final weights (stored as JSON array)
    final_weights = models.JSONField()

    # Individual expert weights (for AIP method, stored as JSON)
    expert_weights = models.JSONField(default=dict)

    # Consistency metrics for aggregated matrix
    consistency_ratio = models.FloatField()
    lambda_max = models.FloatField(null=True, blank=True)
    consistency_index = models.FloatField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Aggregated Results for {self.project.title} ({self.num_experts} experts)"


class Friendship(models.Model):
    """Friend relationships between users."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='friendships')
    friend = models.ForeignKey(User, on_delete=models.CASCADE, related_name='friend_of')

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user', 'friend']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} -> {self.friend.username} ({self.status})"


class Message(models.Model):
    """Messages between users."""
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages')
    content = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.sender.username} -> {self.recipient.username}: {self.content[:50]}"
