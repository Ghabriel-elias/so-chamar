import { cn } from "@/utils/cn";

export function Avatar({
  name,
  photo,
  className,
}: {
  name: string;
  photo?: string;
  className?: string;
}) {
  if (photo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photo}
        alt=""
        className={cn(
          "shrink-0 rounded-full bg-surface object-cover",
          className,
        )}
      />
    );
  }

  const letters = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");

  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-ink font-semibold text-paper",
        className,
      )}
    >
      {letters}
    </span>
  );
}
