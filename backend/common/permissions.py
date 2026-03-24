from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdminRole(BasePermission):
    """
    Allows access only to users with role=ADMIN.
    """

    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        return bool(user and user.is_authenticated and getattr(user, "role", None) == "ADMIN")


class IsAdminOrReadOnly(BasePermission):
    """
    Read-only for authenticated users, write access for ADMIN only.
    """

    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return True
        return getattr(user, "role", None) == "ADMIN"


class IsAdminOrAssignedAgent(BasePermission):
    """
    Ticket/Note/etc. object-level permission:
    - ADMIN: full access
    - AGENT: only objects linked to tickets assigned to them
    """

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if getattr(user, "role", None) in ("ADMIN", "MANAGER"):
            return True

        # Ticket itself
        if hasattr(obj, "assigned_to"):
            return obj.assigned_to_id == user.id

        # Note-like object with ticket FK
        ticket = getattr(obj, "ticket", None)
        if ticket is not None:
            return ticket.assigned_to_id == user.id

        return False


class IsAdminOrManagerNoDelete(BasePermission):
    """
    ADMIN: full access
    MANAGER: all but DELETE
    Others: no access
    """

    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False
        role = getattr(user, "role", None)
        if role == "ADMIN":
            return True
        if role == "MANAGER":
            return request.method != "DELETE"
        return False


class DenyDeleteForManager(BasePermission):
    """
    Supplemental permission to be combined with IsAuthenticated, etc.
    Denies DELETE actions when user.role == MANAGER.
    """

    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False
        if request.method == "DELETE" and getattr(user, "role", None) == "MANAGER":
            return False
        return True

