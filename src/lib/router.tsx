// Small adapter so the components imported from Bolt keep their
// react-router-style API while running on TanStack Router.
import {
  Link as TsLink,
  useLocation,
  useNavigate,
  useParams as useTsParams,
} from "@tanstack/react-router";
import { useCallback, useMemo, type AnchorHTMLAttributes, type ReactNode } from "react";

type BaseProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "className" | "children"> & {
  to: string;
  children?: ReactNode;
};

export function Link({ to, className, ...rest }: BaseProps & { className?: string | undefined }) {
  const [path, search] = to.split("?");
  const searchObj = search ? Object.fromEntries(new URLSearchParams(search)) : undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const L = TsLink as any;
  return <L to={path} search={searchObj} className={className} {...rest} />;
}

export function NavLink({
  to,
  end,
  className,
  children,
  ...rest
}: BaseProps & {
  end?: boolean;
  className?: string | ((s: { isActive: boolean }) => string);
}) {
  const { pathname } = useLocation();
  const isActive = end || to === "/" ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);
  const cls = typeof className === "function" ? className({ isActive }) : className;
  return (
    <Link to={to} className={cls} aria-current={isActive ? "page" : undefined} {...rest}>
      {children}
    </Link>
  );
}

export function useParams(): Record<string, string | undefined> {
  return useTsParams({ strict: false }) as Record<string, string | undefined>;
}

export function useSearchParams(): [URLSearchParams, (next: URLSearchParams | Record<string, string>) => void] {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useMemo(
    () => new URLSearchParams(location.searchStr ?? ""),
    [location.searchStr],
  );
  const setParams = useCallback(
    (next: URLSearchParams | Record<string, string>) => {
      const entries = next instanceof URLSearchParams ? Object.fromEntries(next) : next;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      void navigate({ to: location.pathname, search: entries as any, replace: true });
    },
    [navigate, location.pathname],
  );
  return [params, setParams];
}
