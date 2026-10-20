from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

FieldType = Literal[
    "text", "textarea", "date", "number", "currency", "select", "list", "table"
]
Theme = Literal["blue", "amber", "emerald", "purple", "indigo", "orange", "rose", "green"]
IconName = Literal["FileText", "Award", "Calendar", "FileSpreadsheet"]
Wireframe = Literal["proposal-table", "letter", "bill-table"]
SortKey = Literal["order", "title", "mostUsed", "recent"]


class TableColumn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    key: str = Field(pattern=r"^[a-z][A-Za-z0-9]{0,39}$")
    label: str = Field(min_length=1, max_length=60)


class TemplateField(BaseModel):
    """Contract fields: key, label, type, required, official. Rest is optional."""

    model_config = ConfigDict(extra="forbid")
    key: str = Field(pattern=r"^[a-z][A-Za-z0-9]{0,39}$")
    label: str = Field(min_length=1, max_length=80)
    type: FieldType = "text"
    required: bool = False
    official: bool = False
    group: str | None = Field(default=None, max_length=40)
    helpText: str | None = Field(default=None, max_length=200)
    placeholder: str | None = Field(default=None, max_length=120)
    defaultValue: str | None = Field(default=None, max_length=500)
    example: Any | None = None
    options: list[str] | None = None
    columns: list[TableColumn] | None = None
    autoNumber: bool = False
    prefill: str | None = Field(default=None, max_length=80)


class TemplateBase(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: str = Field(min_length=1, max_length=80)
    category: str = Field(min_length=1, max_length=40)
    description: str = Field(default="", max_length=400)
    iconName: IconName = "FileText"
    theme: Theme = "blue"
    suggestedPrompt: str = Field(default="", max_length=500)
    templateType: str | None = Field(default=None, max_length=60)
    html: str = Field(min_length=1, max_length=200_000)
    fields: list[TemplateField] = Field(default_factory=list, max_length=80)
    previewHeading: str | None = Field(default=None, max_length=80)
    wireframeVariant: Wireframe = "letter"
    formats: list[Literal["DOCX", "PDF"]] = ["DOCX", "PDF"]


class TemplateCreate(TemplateBase):
    pass


class TemplatePatch(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: str | None = Field(default=None, min_length=1, max_length=80)
    category: str | None = Field(default=None, min_length=1, max_length=40)
    description: str | None = Field(default=None, max_length=400)
    iconName: IconName | None = None
    theme: Theme | None = None
    suggestedPrompt: str | None = Field(default=None, max_length=500)
    templateType: str | None = Field(default=None, max_length=60)
    html: str | None = Field(default=None, min_length=1, max_length=200_000)
    fields: list[TemplateField] | None = Field(default=None, max_length=80)
    previewHeading: str | None = Field(default=None, max_length=80)
    wireframeVariant: Wireframe | None = None
    formats: list[Literal["DOCX", "PDF"]] | None = None
    baseVersion: int | None = Field(default=None, ge=1)


class ValidateBody(BaseModel):
    html: str
    fields: list[TemplateField] = []


class PreviewBody(BaseModel):
    values: dict[str, Any] = Field(default_factory=dict)
    useExamples: bool = True
