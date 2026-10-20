from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, Field, model_validator


class InlineTemplate(BaseModel):
    """An unsaved template (free-form mode). Re-validated server side on every use."""
    model_config = ConfigDict(extra="allow")
    title: str
    html: str
    fields: list[dict]
    templateType: str | None = None
    category: str | None = None


class TemplateSelector(BaseModel):
    templateId: str | None = None
    template: InlineTemplate | None = None

    @model_validator(mode="after")
    def one_of(self):
        if bool(self.templateId) == bool(self.template):
            raise ValueError("give exactly one of templateId or template")
        return self


class ExtractBody(BaseModel):
    templateIds: list[str] = Field(default_factory=list, max_length=8)
    template: InlineTemplate | None = None
    text: str = Field(min_length=1, max_length=4000)
    values: dict[str, Any] = Field(default_factory=dict)  # answers collected so far


class DraftBody(TemplateSelector):
    values: dict[str, Any] = Field(default_factory=dict)
    keys: list[str] = Field(min_length=1, max_length=10)


class GenerateBody(TemplateSelector):
    values: dict[str, Any] = Field(default_factory=dict)
    aiKeys: list[str] = Field(default_factory=list)  # fields whose value came from /draft
    title: str | None = Field(default=None, max_length=120)


class FreeformBody(BaseModel):
    prompt: str = Field(min_length=3, max_length=2000)


class CopilotBlock(BaseModel):
    id: int = Field(ge=0)
    type: str = Field(max_length=30)
    text: str = Field(max_length=8000)
    protected: list[str] = Field(default_factory=list, max_length=40)  # filled-in field values inside the block


class CopilotSelection(BaseModel):
    blockId: int = Field(ge=0)
    text: str = Field(min_length=1, max_length=4000)


class CopilotBody(BaseModel):
    instruction: str = Field(min_length=2, max_length=1000)
    blocks: list[CopilotBlock] = Field(min_length=1, max_length=400)
    selection: CopilotSelection | None = None
