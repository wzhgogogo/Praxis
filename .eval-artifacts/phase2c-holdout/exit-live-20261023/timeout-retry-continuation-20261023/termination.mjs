// Eval-only process enforcement: preserve the500s ceiling with no termination grace.
export const stopChild=child=>child.kill('SIGKILL');
