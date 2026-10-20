"""Request bodies. Responses are plain camelCase dicts built in serializers.py."""
from typing import Any, Literal, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field

Status = Literal["Draft", "Needs Review", "Completed"]
Role = Literal["Club Member", "Core Coordinator", "Club Admin", "Faculty Advisor"]


class _Strict(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class SignupIn(_Strict):
    name: str = Field(min_length=1, max_length=80)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: Optional[Role] = None


class LoginIn(_Strict):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class SummaryFields(_Strict):
    venue: Optional[str] = Field(default=None, max_length=300)
    eventDate: Optional[str] = Field(default=None, max_length=200)
    expectedAttendance: Optional[str] = Field(default=None, max_length=100)
    budgetTotal: Optional[str] = Field(default=None, max_length=100)
    summary: Optional[str] = Field(default=None, max_length=2000)
    organizer: Optional[str] = Field(default=None, max_length=200)


class DocumentCreateIn(SummaryFields):
    title: str = Field(min_length=1, max_length=200)
    templateId: str = Field(min_length=1, max_length=100)
    fields: dict[str, Any] = Field(default_factory=dict)
    content: str = Field(min_length=1)


class DocumentPatchIn(SummaryFields):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    status: Optional[Status] = None


class DraftIn(_Strict):
    content: str = Field(min_length=1)
    baseVersion: int = Field(ge=1)


class ContentIn(_Strict):
    content: str = Field(min_length=1)
    fields: Optional[dict[str, Any]] = None
    note: Optional[str] = Field(default=None, max_length=200)
    baseVersion: int = Field(ge=1)
