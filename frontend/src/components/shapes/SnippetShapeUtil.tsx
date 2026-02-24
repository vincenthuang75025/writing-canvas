import { ShapeUtil, Rectangle2d, T, HTMLContainer } from "tldraw";

/* eslint-disable @typescript-eslint/no-explicit-any */

export class SnippetShapeUtil extends ShapeUtil<any> {
  static override type = "snippet" as const;

  static override props = {
    w: T.number,
    h: T.number,
    content: T.string,
  };

  private pendingContent = new Map<string, string>();

  override onEditEnd(shape: any) {
    const pending = this.pendingContent.get(shape.id);
    if (pending !== undefined && pending !== shape.props.content) {
      this.editor.updateShape({
        id: shape.id,
        type: "snippet" as any,
        props: { content: pending },
      });
    }
    this.pendingContent.delete(shape.id);
  }

  override getDefaultProps() {
    return { w: 260, h: 160, content: "" };
  }

  override getGeometry(shape: any) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    });
  }

  override canEdit() {
    return true;
  }

  override canResize() {
    return true;
  }

  override onResize(shape: any, info: any) {
    return {
      props: {
        w: Math.max(140, info.initialBounds.width * info.scaleX),
        h: Math.max(80, info.initialBounds.height * info.scaleY),
      },
    };
  }

  override component(shape: any) {
    const isEditing = this.editor.getEditingShapeId() === shape.id;

    return (
      <HTMLContainer
        id={shape.id}
        style={{
          width: shape.props.w,
          height: shape.props.h,
          pointerEvents: "all",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            background: "#f0fdf4",
            border: "2px solid #86efac",
            borderRadius: 6,
            padding: 12,
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 2px 10px rgba(134, 239, 172, 0.2)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: "#15803d",
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 6,
            }}
          >
            Snippet
          </div>
          {isEditing ? (
            <textarea
              defaultValue={shape.props.content}
              autoFocus
              onChange={(e) => {
                this.pendingContent.set(shape.id, e.currentTarget.value);
              }}
              onBlur={(e) => {
                this.editor.updateShape({
                  id: shape.id,
                  type: "snippet" as any,
                  props: { content: e.currentTarget.value },
                });
                this.pendingContent.delete(shape.id);
              }}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                resize: "none",
                color: "#14532d",
                fontSize: 13,
                fontFamily: "'Georgia', serif",
                lineHeight: 1.6,
              }}
            />
          ) : (
            <span
              style={{
                color: "#14532d",
                fontSize: 13,
                fontFamily: "'Georgia', serif",
                lineHeight: 1.6,
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {shape.props.content || "Double-click to write a snippet..."}
            </span>
          )}
        </div>
      </HTMLContainer>
    );
  }

  override indicator(shape: any) {
    return (
      <rect
        width={shape.props.w}
        height={shape.props.h}
        rx={6}
        ry={6}
        fill="none"
      />
    );
  }
}
