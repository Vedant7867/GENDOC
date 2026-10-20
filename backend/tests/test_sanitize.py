from app.sanitize import sanitize_html


def test_strips_scripts_handlers_iframes_and_links():
    out = sanitize_html('<p onclick="x()">a</p><script>alert(1)</script><iframe src="x"></iframe><a href="javascript:x">l</a>')
    assert out == "<p>a</p>l"


def test_keeps_contract_markup_and_field_spans():
    html = '<h1 class="t">T</h1><p><span data-field="venue">Hall</span> <span data-ai="draft">ai</span></p><table><tr><td colspan="2">c</td></tr></table>'
    out = sanitize_html(html)
    assert 'data-field="venue"' in out and 'data-ai="draft"' in out
    assert "colspan" not in out  # not in the contract's allow-list


def test_only_allowed_inline_styles_survive():
    out = sanitize_html('<p style="text-align:center; color:red; position:fixed; font-weight:bold">x</p>')
    assert out == '<p style="text-align: center; font-weight: bold">x</p>'
    out = sanitize_html('<p><td style="width:40%">x</td></p><table><tr><td style="width:40%; background:url(x)">x</td></tr></table>')
    assert 'width: 40%' in out and "background" not in out


def test_images_only_as_small_data_uris():
    assert "evil.com" not in sanitize_html('<img src="http://evil.com/a.png">')
    assert "<img" not in sanitize_html('<img src="http://evil.com/a.png">')
    assert "<img" in sanitize_html('<img src="data:image/png;base64,AAAA" alt="ok">')
    assert "<img" not in sanitize_html('<img src="data:image/svg+xml;base64,AAAA">')
    big = "A" * 600_000
    assert "<img" not in sanitize_html(f'<img src="data:image/png;base64,{big}">')


def test_bad_data_attributes_are_dropped():
    out = sanitize_html('<span data-ai="yes" data-field="a b">x</span><span data-field="ok1">y</span>')
    assert "data-ai" not in out and 'data-field="a b"' not in out and 'data-field="ok1"' in out


def test_class_values_are_restricted():
    out = sanitize_html('<p class="sig-table field-empty">a</p><p class="x;y">b</p>')
    assert 'class="sig-table field-empty"' in out and 'x;y' not in out
