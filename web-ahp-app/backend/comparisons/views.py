"""
API views for pairwise comparison application.
"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.db.models import Q
import numpy as np

from .models import Project, Comparison, Result, ProjectCollaborator, AggregatedResult, UserProfile
from .serializers import (
    ProjectSerializer, ProjectListSerializer,
    ComparisonSerializer, ResultSerializer,
    UserSerializer, UserRegistrationSerializer
)
from .calculations import (
    build_comparison_matrix,
    calculate_weights_eigenvector,
    check_consistency,
    calculate_rankings
)
from .aggregation import aggregate_comparisons_aij, save_aggregated_result


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """Register a new user."""
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()

        # Generate tokens
        refresh = RefreshToken.for_user(user)

        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """Login user."""
    username = request.data.get('username')
    password = request.data.get('password')

    user = authenticate(username=username, password=password)

    if user:
        refresh = RefreshToken.for_user(user)

        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        })

    return Response(
        {'error': 'Invalid credentials'},
        status=status.HTTP_401_UNAUTHORIZED
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    """Get current authenticated user."""
    return Response(UserSerializer(request.user).data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_user(request):
    """Update current user profile."""
    user = request.user

    # Update allowed fields
    if 'email' in request.data:
        user.email = request.data['email']
    if 'first_name' in request.data:
        user.first_name = request.data['first_name']
    if 'last_name' in request.data:
        user.last_name = request.data['last_name']

    user.save()

    # Update avatar URL if provided
    if 'avatar_url' in request.data:
        profile, created = UserProfile.objects.get_or_create(user=user)
        profile.avatar_url = request.data['avatar_url']
        profile.save()

    return Response(UserSerializer(user).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """Change user password."""
    user = request.user
    current_password = request.data.get('current_password')
    new_password = request.data.get('new_password')

    if not current_password or not new_password:
        return Response(
            {'error': 'Current password and new password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Check current password
    if not user.check_password(current_password):
        return Response(
            {'error': 'Current password is incorrect'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Validate new password
    if len(new_password) < 8:
        return Response(
            {'error': 'New password must be at least 8 characters'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Set new password
    user.set_password(new_password)
    user.save()

    return Response({'message': 'Password changed successfully'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pending_invitations(request):
    """Get pending project invitations for current user."""
    collaborations = ProjectCollaborator.objects.filter(
        user=request.user,
        status='invited'
    ).select_related('project', 'project__user')

    invitations = []
    for collab in collaborations:
        invitations.append({
            'id': collab.id,
            'project': {
                'id': collab.project.id,
                'title': collab.project.title,
                'description': collab.project.description,
                'user': {
                    'id': collab.project.user.id,
                    'username': collab.project.user.username,
                    'email': collab.project.user.email,
                }
            },
            'invited_at': collab.invited_at,
            'role': collab.role,
        })

    return Response(invitations)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def accept_invitation(request, collaboration_id):
    """Accept a project invitation."""
    try:
        collaboration = ProjectCollaborator.objects.get(
            id=collaboration_id,
            user=request.user,
            status='invited'
        )

        collaboration.status = 'active'
        collaboration.save()

        return Response({
            'message': 'Invitation accepted',
            'project_id': collaboration.project.id,
            'project_title': collaboration.project.title,
        })
    except ProjectCollaborator.DoesNotExist:
        return Response(
            {'error': 'Invitation not found or already processed'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def decline_invitation(request, collaboration_id):
    """Decline a project invitation."""
    try:
        collaboration = ProjectCollaborator.objects.get(
            id=collaboration_id,
            user=request.user,
            status='invited'
        )

        # Delete the collaboration record
        collaboration.delete()

        return Response({'message': 'Invitation declined'})
    except ProjectCollaborator.DoesNotExist:
        return Response(
            {'error': 'Invitation not found or already processed'},
            status=status.HTTP_404_NOT_FOUND
        )


class ProjectViewSet(viewsets.ModelViewSet):
    """ViewSet for Project model."""
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return ProjectListSerializer
        return ProjectSerializer

    def get_queryset(self):
        """
        Return projects where user is either:
        1. The owner (user field), OR
        2. An active/completed/invited collaborator
        """
        return Project.objects.filter(
            Q(user=self.request.user) |
            Q(collaborators__user=self.request.user,
              collaborators__status__in=['invited', 'active', 'completed'])
        ).distinct()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def add_comparison(self, request, pk=None):
        """Add a pairwise comparison to the project."""
        project = self.get_object()

        # Validate indices
        index_a = request.data.get('index_a')
        index_b = request.data.get('index_b')
        value = request.data.get('value')
        direction = request.data.get('direction')

        if index_a is None or index_b is None or value is None:
            return Response(
                {'error': 'index_a, index_b, and value are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Ensure index_a < index_b (canonical form)
        if index_a > index_b:
            index_a, index_b = index_b, index_a
            value = 1.0 / value if value != 0 else 1.0
            direction = 'less' if direction == 'more' else 'more'

        # Create or update comparison
        # For collaborative projects, associate comparison with user
        defaults = {
            'value': value,
            'direction': direction,
            'reliability': request.data.get('reliability', 0.0),
            'scale_str': request.data.get('scale_str', '259'),
            'scale_type': request.data.get('scale_type', 1),
            'gradations': request.data.get('gradations', 3),
            'refinement_level': request.data.get('refinement_level', 0),
        }

        if project.is_collaborative:
            # For collaborative projects, store user-specific comparison
            defaults['user'] = request.user
            comparison, created = Comparison.objects.update_or_create(
                project=project,
                user=request.user,
                index_a=index_a,
                index_b=index_b,
                defaults=defaults
            )

            # Auto-transition collaborator from 'invited' to 'active' on first comparison
            try:
                collaborator = ProjectCollaborator.objects.get(project=project, user=request.user)
                if collaborator.status == 'invited':
                    collaborator.status = 'active'
                    collaborator.save()
            except ProjectCollaborator.DoesNotExist:
                pass  # Owner doesn't have ProjectCollaborator entry
        else:
            # For single-user projects, maintain backward compatibility
            comparison, created = Comparison.objects.update_or_create(
                project=project,
                index_a=index_a,
                index_b=index_b,
                defaults=defaults
            )

        # Update project status (check completion per user in collaborative mode)
        n = len(project.alternatives)
        total_needed = n * (n - 1) // 2

        if project.is_collaborative:
            # For collaborative projects, count only current user's comparisons
            user_completed_count = project.comparisons.filter(user=request.user).count()
            # Don't change project status - each user tracks their own completion
        else:
            # For single-user projects, maintain backward compatibility
            completed_count = project.comparisons.count()
            if completed_count >= total_needed:
                project.status = 'completed'
                project.save()

        return Response(ComparisonSerializer(comparison).data)

    @action(detail=True, methods=['post'])
    def calculate_results(self, request, pk=None):
        """Calculate weights and consistency for completed comparisons."""
        project = self.get_object()

        # CRITICAL: In collaborative mode, check if all experts completed
        if project.is_collaborative:
            # Check if all collaborators have completed
            total_collaborators = ProjectCollaborator.objects.filter(
                project=project,
                status__in=['active', 'completed']
            ).count()

            completed_collaborators = ProjectCollaborator.objects.filter(
                project=project,
                status='completed'
            ).count()

            if completed_collaborators < total_collaborators:
                # Not all experts finished yet
                return Response(
                    {
                        'status': 'waiting_for_others',
                        'message': 'Очікування результатів інших експертів',
                        'completed_experts': completed_collaborators,
                        'total_experts': total_collaborators,
                        'help': 'Результати будуть доступні після завершення роботи всіх експертів'
                    },
                    status=status.HTTP_200_OK  # Not an error - it's a valid state
                )

            # All experts completed - redirect to aggregation
            return Response(
                {
                    'status': 'ready_for_aggregation',
                    'message': 'Всі експерти завершили роботу. Результати можна агрегувати.',
                    'completed_experts': completed_collaborators,
                    'help': 'POST /api/projects/{id}/aggregate/'
                },
                status=status.HTTP_200_OK
            )

        # Single-user mode: calculate results normally
        n = len(project.alternatives)
        total_needed = n * (n - 1) // 2
        completed_count = project.comparisons.count()

        if completed_count < total_needed:
            return Response(
                {'error': f'Need {total_needed} comparisons, have {completed_count}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Build comparison matrix from user's comparisons
        comparisons_list = [
            (c.index_a, c.index_b, c.value)
            for c in project.comparisons.all()
        ]
        matrix = build_comparison_matrix(n, comparisons_list)

        # Calculate weights
        weights = calculate_weights_eigenvector(matrix)

        # Calculate rankings
        rankings = calculate_rankings(weights)

        # Check consistency
        consistency = check_consistency(matrix, weights)

        # Create or update result
        result, created = Result.objects.update_or_create(
            project=project,
            defaults={
                'matrix': matrix.tolist(),
                'weights': weights.tolist(),
                'rankings': rankings.tolist(),
                'lambda_max': consistency['lambda_max'],
                'consistency_index': consistency['CI'],
                'consistency_ratio': consistency['CR'],
                'is_consistent': consistency['is_consistent'],
                'recommendations': consistency['recommendations'],
            }
        )

        # Update project status
        project.status = 'completed'
        project.save()

        return Response(ResultSerializer(result).data)

    @action(detail=True, methods=['delete'])
    def delete_comparison(self, request, pk=None):
        """Delete a specific comparison."""
        project = self.get_object()
        index_a = request.data.get('index_a')
        index_b = request.data.get('index_b')

        if index_a is None or index_b is None:
            return Response(
                {'error': 'index_a and index_b are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Ensure canonical form
        if index_a > index_b:
            index_a, index_b = index_b, index_a

        try:
            # CRITICAL: In collaborative mode, only allow deleting own comparisons
            if project.is_collaborative:
                comparison = Comparison.objects.get(
                    project=project,
                    user=request.user,
                    index_a=index_a,
                    index_b=index_b
                )
            else:
                comparison = Comparison.objects.get(
                    project=project,
                    index_a=index_a,
                    index_b=index_b
                )
            comparison.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Comparison.DoesNotExist:
            return Response(
                {'error': 'Comparison not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['get'])
    def my_progress(self, request, pk=None):
        """Get current user's completion progress and comparisons."""
        project = self.get_object()
        user = request.user

        n = len(project.alternatives)
        total_needed = n * (n - 1) // 2

        if project.is_collaborative:
            # Get only current user's comparisons
            user_comparisons = Comparison.objects.filter(
                project=project,
                user=user
            )
            completed_count = user_comparisons.count()

            # Get collaborator status
            try:
                collaborator = ProjectCollaborator.objects.get(project=project, user=user)
                collab_status = collaborator.status

                # Auto-transition from 'invited' to 'active' when user first accesses project
                if collaborator.status == 'invited':
                    collaborator.status = 'active'
                    collaborator.save()
                    collab_status = 'active'
            except ProjectCollaborator.DoesNotExist:
                collab_status = 'owner' if project.user == user else 'unknown'
        else:
            # Single-user mode
            user_comparisons = project.comparisons.all()
            completed_count = user_comparisons.count()
            collab_status = 'owner'

        return Response({
            'total_needed': total_needed,
            'completed': completed_count,
            'progress_percentage': (completed_count / total_needed * 100) if total_needed > 0 else 0,
            'is_complete': completed_count >= total_needed,
            'is_collaborative': project.is_collaborative,
            'status': collab_status,
            'comparisons': ComparisonSerializer(user_comparisons, many=True).data
        })

    @action(detail=True, methods=['get'])
    def collaboration_status(self, request, pk=None):
        """Get collaboration status for current user."""
        project = self.get_object()
        user = request.user

        if not project.is_collaborative:
            return Response({
                'is_collaborative': False,
                'can_view_results': True,
                'message': 'Проект в режимі одного користувача'
            })

        # Get current user's completion status
        n = len(project.alternatives)
        total_needed = n * (n - 1) // 2
        user_comparisons_count = Comparison.objects.filter(
            project=project,
            user=user
        ).count()
        user_is_complete = user_comparisons_count >= total_needed

        # Get overall collaboration status
        total_collaborators = ProjectCollaborator.objects.filter(
            project=project,
            status__in=['active', 'completed']
        ).count()

        completed_collaborators = ProjectCollaborator.objects.filter(
            project=project,
            status='completed'
        ).count()

        all_experts_done = completed_collaborators >= total_collaborators

        # Determine status
        if not user_is_complete:
            status_value = 'in_progress'
            message = 'Продовжуйте виконувати порівняння'
        elif user_is_complete and not all_experts_done:
            status_value = 'waiting_for_others'
            message = f'Очікування результатів інших експертів ({completed_collaborators}/{total_collaborators} завершили)'
        else:
            status_value = 'ready_for_aggregation'
            message = 'Всі експерти завершили роботу. Результати доступні.'

        return Response({
            'is_collaborative': True,
            'user_is_complete': user_is_complete,
            'all_experts_done': all_experts_done,
            'completed_experts': completed_collaborators,
            'total_experts': total_collaborators,
            'status': status_value,
            'message': message,
            'can_view_results': all_experts_done
        })

    @action(detail=True, methods=['post'])
    def enable_collaboration(self, request, pk=None):
        """Enable or disable collaborative mode for a project."""
        project = self.get_object()
        enabled = request.data.get('enabled', True)

        project.is_collaborative = enabled
        project.save()

        # If enabling for the first time, add owner as collaborator
        if enabled:
            ProjectCollaborator.objects.get_or_create(
                project=project,
                user=project.user,
                defaults={'role': 'owner', 'status': 'active'}
            )

        return Response({
            'is_collaborative': project.is_collaborative,
            'message': 'Collaboration enabled' if enabled else 'Collaboration disabled'
        })

    @action(detail=True, methods=['post'])
    def invite_collaborators(self, request, pk=None):
        """Invite users to collaborate on a project."""
        project = self.get_object()

        if not project.is_collaborative:
            return Response(
                {'error': 'Project must have collaboration enabled'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Support both user_ids and usernames/emails
        user_ids = request.data.get('user_ids', [])
        usernames = request.data.get('usernames', [])
        emails = request.data.get('emails', [])
        role = request.data.get('role', 'contributor')

        if not user_ids and not usernames and not emails:
            return Response(
                {'error': 'user_ids, usernames, or emails is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        invited = []
        errors = []

        # Invite by user_id
        for user_id in user_ids:
            try:
                user = User.objects.get(id=user_id)
                collaborator, created = ProjectCollaborator.objects.get_or_create(
                    project=project,
                    user=user,
                    defaults={'role': role, 'status': 'invited'}
                )
                invited.append({
                    'user_id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'created': created,
                    'status': 'invited' if created else collaborator.status
                })
            except User.DoesNotExist:
                errors.append(f'User with ID {user_id} not found')

        # Invite by username
        for username in usernames:
            try:
                user = User.objects.get(username=username)
                collaborator, created = ProjectCollaborator.objects.get_or_create(
                    project=project,
                    user=user,
                    defaults={'role': role, 'status': 'invited'}
                )
                invited.append({
                    'user_id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'created': created,
                    'status': 'invited' if created else collaborator.status
                })
            except User.DoesNotExist:
                errors.append(f'User "{username}" not found')

        # Invite by email
        for email in emails:
            try:
                user = User.objects.get(email=email)
                collaborator, created = ProjectCollaborator.objects.get_or_create(
                    project=project,
                    user=user,
                    defaults={'role': role, 'status': 'invited'}
                )
                invited.append({
                    'user_id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'created': created,
                    'status': 'invited' if created else collaborator.status
                })
            except User.DoesNotExist:
                errors.append(f'User with email "{email}" not found')

        return Response({
            'invited': invited,
            'errors': errors
        })

    @action(detail=True, methods=['get'])
    def collaborators(self, request, pk=None):
        """Get list of collaborators for a project."""
        project = self.get_object()

        collaborators = ProjectCollaborator.objects.filter(project=project)
        data = []
        for collab in collaborators:
            data.append({
                'user_id': collab.user.id,
                'username': collab.user.username,
                'role': collab.role,
                'status': collab.status,
                'invited_at': collab.invited_at,
                'completed_at': collab.completed_at,
            })

        return Response({'collaborators': data})

    @action(detail=True, methods=['post'])
    def mark_completed(self, request, pk=None):
        """Mark user's comparisons as completed."""
        project = self.get_object()
        user = request.user

        # Check if user has completed all comparisons
        n = len(project.alternatives)
        total_needed = n * (n - 1) // 2

        if project.is_collaborative:
            completed_count = Comparison.objects.filter(
                project=project,
                user=user
            ).count()
        else:
            completed_count = project.comparisons.count()

        if completed_count < total_needed:
            return Response(
                {'error': f'Need {total_needed} comparisons, have {completed_count}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Mark collaborator as completed
        if project.is_collaborative:
            from django.utils import timezone
            collaborator = ProjectCollaborator.objects.get(project=project, user=user)
            collaborator.status = 'completed'
            collaborator.completed_at = timezone.now()
            collaborator.save()

        return Response({'message': 'Comparisons marked as completed'})

    @action(detail=True, methods=['post'])
    def aggregate(self, request, pk=None):
        """Calculate aggregated results from multiple experts."""
        project = self.get_object()

        if not project.is_collaborative:
            return Response(
                {'error': 'Project must have collaboration enabled'},
                status=status.HTTP_400_BAD_REQUEST
            )

        method = request.data.get('method', 'AIJ')

        try:
            aggregated_result = save_aggregated_result(project.id, method)
            return Response({
                'id': aggregated_result.id,
                'method': aggregated_result.aggregation_method,
                'num_experts': aggregated_result.num_experts,
                'aggregated_matrix': aggregated_result.aggregated_matrix,
                'final_weights': aggregated_result.final_weights,
                'consistency_ratio': aggregated_result.consistency_ratio,
                'lambda_max': aggregated_result.lambda_max,
                'consistency_index': aggregated_result.consistency_index,
            })
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['get'])
    def aggregated_results(self, request, pk=None):
        """Get aggregated results for a collaborative project."""
        project = self.get_object()

        if not project.is_collaborative:
            return Response(
                {'error': 'Project must have collaboration enabled'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get latest aggregated result
        try:
            result = AggregatedResult.objects.filter(project=project).latest('created_at')

            # Get expert breakdown with individual results
            collaborators = ProjectCollaborator.objects.filter(project=project)
            expert_breakdown = []
            individual_results = []

            for collab in collaborators:
                expert_breakdown.append({
                    'user_id': collab.user.id,
                    'username': collab.user.username,
                    'status': collab.status,
                    'completed_at': collab.completed_at,
                })

                # Get individual expert's results if they completed
                if collab.status == 'completed':
                    try:
                        from .calculations import build_comparison_matrix
                        from .aggregation import calculate_eigenvector_weights

                        # Build matrix from this expert's comparisons
                        comparisons = Comparison.objects.filter(
                            project=project,
                            user=collab.user
                        )

                        if comparisons.exists():
                            # Convert queryset to list of tuples (index_a, index_b, value)
                            comp_data = [(c['index_a'], c['index_b'], c['value'])
                                        for c in comparisons.values('index_a', 'index_b', 'value')]

                            matrix = build_comparison_matrix(
                                len(project.alternatives),  # Pass integer, not list
                                comp_data  # Pass list of tuples
                            )

                            # Calculate weights for this expert
                            weights, lambda_max, ci, cr = calculate_eigenvector_weights(matrix)  # Returns 4 values

                            individual_results.append({
                                'user_id': collab.user.id,
                                'username': collab.user.username,
                                'matrix': matrix.tolist(),
                                'weights': weights.tolist(),
                                'consistency_ratio': float(cr),
                                'lambda_max': float(lambda_max),
                                'consistency_index': float(ci),
                            })
                    except Exception as e:
                        print(f"Error calculating individual result for {collab.user.username}: {e}")
                        continue

            return Response({
                'method': result.aggregation_method,
                'num_experts': result.num_experts,
                'aggregated_matrix': result.aggregated_matrix,
                'weights': result.final_weights,
                'consistency_ratio': result.consistency_ratio,
                'lambda_max': result.lambda_max,
                'consistency_index': result.consistency_index,
                'expert_breakdown': expert_breakdown,
                'individual_results': individual_results,
                'created_at': result.created_at,
            })
        except AggregatedResult.DoesNotExist:
            return Response(
                {'error': 'No aggregated results found. Run aggregation first.'},
                status=status.HTTP_404_NOT_FOUND
            )


# Friends and Messages endpoints

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_friends(request):
    """Get user's friends list."""
    user = request.user

    # Get accepted friendships where user is either the requester or recipient
    from .models import Friendship
    from .serializers import FriendshipSerializer

    friendships = Friendship.objects.filter(
        Q(user=user) | Q(friend=user),
        status='accepted'
    )

    return Response(FriendshipSerializer(friendships, many=True).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_friend_requests(request):
    """Get pending friend requests."""
    user = request.user
    from .models import Friendship
    from .serializers import FriendshipSerializer

    # Get pending requests where current user is the recipient
    requests = Friendship.objects.filter(friend=user, status='pending')

    return Response(FriendshipSerializer(requests, many=True).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_friend_request(request):
    """Send a friend request."""
    from .models import Friendship
    from .serializers import FriendshipSerializer
    from django.contrib.auth.models import User as DjangoUser

    username = request.data.get('username')
    if not username:
        return Response({'error': 'Username is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        friend = DjangoUser.objects.get(username=username)
    except DjangoUser.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    if friend == request.user:
        return Response({'error': 'Cannot send friend request to yourself'}, status=status.HTTP_400_BAD_REQUEST)

    # Check if friendship already exists
    existing = Friendship.objects.filter(
        Q(user=request.user, friend=friend) | Q(user=friend, friend=request.user)
    ).first()

    if existing:
        return Response({'error': 'Friend request already exists'}, status=status.HTTP_400_BAD_REQUEST)

    friendship = Friendship.objects.create(user=request.user, friend=friend)
    return Response(FriendshipSerializer(friendship).data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def accept_friend_request(request, friendship_id):
    """Accept a friend request."""
    from .models import Friendship
    from .serializers import FriendshipSerializer

    try:
        friendship = Friendship.objects.get(id=friendship_id, friend=request.user, status='pending')
        friendship.status = 'accepted'
        friendship.save()
        return Response(FriendshipSerializer(friendship).data)
    except Friendship.DoesNotExist:
        return Response({'error': 'Friend request not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def decline_friend_request(request, friendship_id):
    """Decline a friend request."""
    from .models import Friendship

    try:
        friendship = Friendship.objects.get(id=friendship_id, friend=request.user, status='pending')
        friendship.delete()
        return Response({'message': 'Friend request declined'})
    except Friendship.DoesNotExist:
        return Response({'error': 'Friend request not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_messages(request, user_id):
    """Get messages between current user and another user."""
    from .models import Message
    from .serializers import MessageSerializer
    from django.contrib.auth.models import User as DjangoUser

    try:
        other_user = DjangoUser.objects.get(id=user_id)
    except DjangoUser.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    # Get messages between the two users
    messages = Message.objects.filter(
        Q(sender=request.user, recipient=other_user) | Q(sender=other_user, recipient=request.user)
    ).order_by('created_at')

    # Mark messages as read
    Message.objects.filter(sender=other_user, recipient=request.user, is_read=False).update(is_read=True)

    return Response(MessageSerializer(messages, many=True).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_message(request, user_id):
    """Send a message to another user."""
    from .models import Message
    from .serializers import MessageSerializer
    from django.contrib.auth.models import User as DjangoUser

    try:
        recipient = DjangoUser.objects.get(id=user_id)
    except DjangoUser.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    content = request.data.get('content')
    if not content:
        return Response({'error': 'Message content is required'}, status=status.HTTP_400_BAD_REQUEST)

    message = Message.objects.create(sender=request.user, recipient=recipient, content=content)
    return Response(MessageSerializer(message).data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_unread_count(request):
    """Get unread message count."""
    from .models import Message

    count = Message.objects.filter(recipient=request.user, is_read=False).count()
    return Response({'unread_count': count})
