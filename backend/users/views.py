from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .serializers import UserSerializer, CurrentUserUpdateSerializer, ChangePasswordSerializer
from .models import User
from common.permissions import IsAdminRole, IsAdminOrManagerNoDelete


class CurrentUserView(RetrieveUpdateAPIView):

    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return CurrentUserUpdateSerializer
        return UserSerializer


class UserViewSet(ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    # ADMIN full access; MANAGER can do everything except DELETE
    permission_classes = [IsAdminOrManagerNoDelete]

    def destroy(self, request, *args, **kwargs):
        """
        Disallow deletion of users for all roles. Return 403.
        """
        return Response({"detail": "User deletion is disabled."}, status=status.HTTP_403_FORBIDDEN)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        user: User = request.user
        old_password = serializer.validated_data["old_password"]
        new_password = serializer.validated_data["new_password"]

        if not user.check_password(old_password):
            return Response({"old_password": ["Current password is incorrect."]}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save(update_fields=["password"])
        return Response({"ok": True}, status=status.HTTP_200_OK)