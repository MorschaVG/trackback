const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function pad2(value) {
    return String(value).padStart(2, "0");
}

export function formatUtcRfc2822NoSecondsNoZone(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);

    const weekday = WEEKDAYS[date.getUTCDay()];
    const day = pad2(date.getUTCDate());
    const month = MONTHS[date.getUTCMonth()];
    const year = date.getUTCFullYear();
    const hour = pad2(date.getUTCHours());
    const minute = pad2(date.getUTCMinutes());

    return `${weekday}, ${day} ${month} ${year} ${hour}:${minute}`;
}

