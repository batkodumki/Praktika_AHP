"""
Serializers for REST API.
"""
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Project, Comparison, Result, Friendship, Message


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model."""
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'avatar_url']
        read_only_fields = ['id']

    def get_avatar_url(self, obj):
        """Get avatar URL from user profile."""
        if hasattr(obj, 'profile') and obj.profile.avatar_url:
            return obj.profile.avatar_url
        return None


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm', 'first_name', 'last_name']

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError("Passwords do not match")
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user


class ComparisonSerializer(serializers.ModelSerializer):
    """Serializer for Comparison model."""

    class Meta:
        model = Comparison
        fields = [
            'id', 'index_a', 'index_b', 'value',
            'direction', 'reliability', 'scale_str',
            'scale_type', 'gradations', 'refinement_level',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ResultSerializer(serializers.ModelSerializer):
    """Serializer for Result model."""

    class Meta:
        model = Result
        fields = [
            'id', 'matrix', 'weights', 'rankings',
            'lambda_max', 'consistency_index', 'consistency_ratio',
            'is_consistent', 'recommendations',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProjectSerializer(serializers.ModelSerializer):
    """Serializer for Project model."""
    comparisons = ComparisonSerializer(many=True, read_only=True)
    result = ResultSerializer(read_only=True)
    user = UserSerializer(read_only=True)

    class Meta:
        model = Project
        fields = [
            'id', 'title', 'description', 'alternatives',
            'scale_type', 'status', 'is_collaborative', 'comparisons', 'result',
            'user', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']


class ProjectListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for project list."""
    comparison_count = serializers.SerializerMethodField()
    total_comparisons = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            'id', 'title', 'description', 'status',
            'alternatives', 'scale_type', 'is_collaborative',
            'comparison_count', 'total_comparisons',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_comparison_count(self, obj):
        return obj.comparisons.count()

    def get_total_comparisons(self, obj):
        n = len(obj.alternatives)
        return n * (n - 1) // 2 if n > 1 else 0



class FriendshipSerializer(serializers.ModelSerializer):
    """Serializer for Friendship model."""
    user = UserSerializer(read_only=True)
    friend = UserSerializer(read_only=True)

    class Meta:
        model = Friendship
        fields = ["id", "user", "friend", "status", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class MessageSerializer(serializers.ModelSerializer):
    """Serializer for Message model."""
    sender = UserSerializer(read_only=True)
    recipient = UserSerializer(read_only=True)

    class Meta:
        model = Message
        fields = ["id", "sender", "recipient", "content", "is_read", "created_at"]
        read_only_fields = ["id", "created_at"]

