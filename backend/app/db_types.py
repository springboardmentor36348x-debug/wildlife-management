"""
A UUID column type that works across both SQLite (used for local/dev setup)
and PostgreSQL (used in production), since SQLite has no native UUID type.

Usage in models: replace
    from sqlalchemy.dialects.postgresql import UUID
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
with
    from app.db_types import GUID
    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
"""
import uuid

from sqlalchemy.types import TypeDecorator, CHAR
from sqlalchemy.dialects.postgresql import UUID as PG_UUID


class GUID(TypeDecorator):
    """Platform-independent GUID type.
    Uses PostgreSQL's native UUID type when available, otherwise stores
    as a 36-character string (SQLite, etc.).
    """
    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PG_UUID())
        return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        if dialect.name == "postgresql":
            return str(value)
        if not isinstance(value, uuid.UUID):
            return str(uuid.UUID(value))
        return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if not isinstance(value, uuid.UUID):
            return uuid.UUID(value)
        return value
