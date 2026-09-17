import { LoaderCircle, type LucideIcon } from "lucide-react";
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react";

import { Link } from "@/utils/navigation";
import { cn } from "@/utils/cn";

export type ButtonLook =
  | "primary"
  | "secondary"
  | "destructive"
  | "destructive_solid"
  | "plain";

const LOOKS: Record<ButtonLook, string> = {
  primary:
    "bg-action text-white font-semibold border border-action shadow-soft hover:shadow-lift active:bg-action-pressed active:border-action-pressed active:shadow-soft",
  secondary:
    "bg-white text-ink font-medium border border-border-strong active:bg-surface",
  destructive:
    "bg-white text-red font-medium border border-red active:bg-red-soft",
  destructive_solid:
    "bg-red text-white font-semibold border border-red shadow-soft hover:shadow-lift active:bg-red-dark active:border-red-dark active:shadow-soft",
  plain:
    "bg-transparent text-blue font-medium border border-transparent underline underline-offset-4",
};

const BASE =
  "touchable inline-flex items-center justify-center gap-2 rounded-full px-6 text-body active:scale-[0.98] disabled:pointer-events-none disabled:border-border disabled:bg-surface disabled:text-gray disabled:shadow-none";

function height(look: ButtonLook) {
  return look === "primary" || look === "destructive_solid"
    ? "min-h-touch-lg"
    : "min-h-touch";
}

function Inner({
  Icon,
  loading,
  children,
}: {
  Icon?: LucideIcon;
  loading?: boolean;
  children: ReactNode;
}) {
  return (
    <>
      {loading ? (
        <LoaderCircle
          aria-hidden="true"
          className="size-5 shrink-0 animate-spin motion-reduce:animate-none"
        />
      ) : Icon ? (
        <Icon aria-hidden="true" className="size-5 shrink-0" />
      ) : null}
      <span>{children}</span>
    </>
  );
}

type ButtonProps = {
  look?: ButtonLook;
  icon?: LucideIcon;
  loading?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">;

export function Button({
  look = "secondary",
  icon,
  loading = false,
  fullWidth = false,
  className,
  disabled,
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        BASE,
        LOOKS[look],
        height(look),
        fullWidth && "w-full",
        className,
      )}
      {...rest}
    >
      <Inner Icon={icon} loading={loading}>
        {children}
      </Inner>
    </button>
  );
}

type ButtonLinkProps = {
  look?: ButtonLook;
  icon?: LucideIcon;
  fullWidth?: boolean;
  children: ReactNode;
  href: ComponentProps<typeof Link>["href"];
} & Omit<ComponentProps<typeof Link>, "children" | "href">;

export function ButtonLink({
  look = "secondary",
  icon,
  fullWidth = false,
  className,
  children,
  href,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        BASE,
        LOOKS[look],
        height(look),
        fullWidth && "w-full",
        className,
      )}
      {...rest}
    >
      <Inner Icon={icon}>{children}</Inner>
    </Link>
  );
}

export function ButtonLabel({
  look = "secondary",
  icon,
  fullWidth = false,
  className,
  children,
  ...rest
}: {
  look?: ButtonLook;
  icon?: LucideIcon;
  fullWidth?: boolean;
  children: ReactNode;
  htmlFor: string;
} & Omit<ComponentProps<"label">, "children">) {
  return (
    <label
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        event.currentTarget.control?.click();
      }}
      className={cn(
        BASE,
        LOOKS[look],
        height(look),
        fullWidth && "w-full",
        className,
      )}
      {...rest}
    >
      <Inner Icon={icon}>{children}</Inner>
    </label>
  );
}

export function ExternalButton({
  look = "secondary",
  icon,
  fullWidth = false,
  className,
  children,
  ...rest
}: {
  look?: ButtonLook;
  icon?: LucideIcon;
  fullWidth?: boolean;
  children: ReactNode;
} & Omit<ComponentProps<"a">, "children">) {
  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        BASE,
        LOOKS[look],
        height(look),
        fullWidth && "w-full",
        className,
      )}
      {...rest}
    >
      <Inner Icon={icon}>{children}</Inner>
    </a>
  );
}
