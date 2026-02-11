from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

router = DefaultRouter()
router.register(r"projects", views.ProjectViewSet, basename="project")

urlpatterns = [
    # Authentication
    path("auth/register/", views.register, name="register"),
    path("auth/login/", views.login, name="login"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/user/", views.current_user, name="current_user"),
    path("auth/user/update/", views.update_user, name="update_user"),
    path("auth/change-password/", views.change_password, name="change_password"),

    # Invitations
    path("invitations/", views.pending_invitations, name="pending_invitations"),
    path("invitations/<int:collaboration_id>/accept/", views.accept_invitation, name="accept_invitation"),
    path("invitations/<int:collaboration_id>/decline/", views.decline_invitation, name="decline_invitation"),

    # Friends
    path("friends/", views.get_friends, name="get_friends"),
    path("friends/requests/", views.get_friend_requests, name="get_friend_requests"),
    path("friends/send/", views.send_friend_request, name="send_friend_request"),
    path("friends/<int:friendship_id>/accept/", views.accept_friend_request, name="accept_friend_request"),
    path("friends/<int:friendship_id>/decline/", views.decline_friend_request, name="decline_friend_request"),

    # Messages
    path("messages/<int:user_id>/", views.get_messages, name="get_messages"),
    path("messages/<int:user_id>/send/", views.send_message, name="send_message"),
    path("messages/unread/", views.get_unread_count, name="get_unread_count"),

    # ViewSets
    path("", include(router.urls)),
]
