import { createElement } from "react";
import "./Pillbox.css";

const SIZE_CLASS_BY_NAME = {
    large: "pillbox--large",
    medium: "pillbox--medium",
    small: "pillbox--small",
};

function toWidthValue(width) {
    if (width === undefined || width === null || width === "") return undefined;
    return typeof width === "number" ? `${width}px` : width;
}

function buildClassName(parts) {
    return parts.filter(Boolean).join(" ");
}

export default function Pillbox({
    as: Component = "div",
    size = "medium",
    width,
    className = "",
    style,
    ...props
}) {
    const sizeClass = SIZE_CLASS_BY_NAME[size] || SIZE_CLASS_BY_NAME.medium;
    const widthValue = toWidthValue(width);

    return createElement(Component, {
        className: buildClassName(["pillbox", sizeClass, "pillbox-static", className]),
        style: {
            ...(widthValue ? { "--pillbox-width": widthValue } : {}),
            ...style,
        },
        ...props,
    });
}

export function PillboxInput({
    size = "medium",
    width,
    className = "",
    style,
    ...props
}) {
    const sizeClass = SIZE_CLASS_BY_NAME[size] || SIZE_CLASS_BY_NAME.medium;
    const widthValue = toWidthValue(width);

    return (
        <input
            className={buildClassName(["pillbox", sizeClass, "pillbox-input", className])}
            style={{
                ...(widthValue ? { "--pillbox-width": widthValue } : {}),
                ...style,
            }}
            {...props}
        />
    );
}
