import type { ReactNode } from 'react';

type FetchingWrapperProps = {
  isFetching: boolean;
  children: ReactNode;
};

export function FetchingWrapper({ isFetching, children }: FetchingWrapperProps) {
  return (
    <div className={isFetching ? 'opacity-70 transition-opacity' : ''}>{children}</div>
  );
}
