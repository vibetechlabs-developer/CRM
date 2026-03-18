from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CurrentUserView, UserViewSet

router = DefaultRouter()
router.register(r'', UserViewSet, basename='user')

urlpatterns = [
    path("me/", CurrentUserView.as_view(), name="current-user"),
    path("", include(router.urls)),
]