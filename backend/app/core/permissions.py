from fastapi import Depends, HTTPException, status
from app.api.deps import get_current_user
from app.models.user import User


def require_role(allowed_roles):
    """
    Restrict a route to one or more roles.

    Usage:
        Depends(require_role("administrator"))
        Depends(require_role(["administrator", "forest_officer"]))
    """
    if isinstance(allowed_roles, str):
        allowed_roles = [allowed_roles]

    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action."
            )
        return current_user
    return role_checker