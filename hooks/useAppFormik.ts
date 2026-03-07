/**
 * useAppFormik — wraps Formik with automatic backend error extraction.
 *
 * Usage:
 *   const form = useAppFormik({ initialValues, validationSchema, onSubmit });
 *   // form.serverError   → string | null  (backend message)
 *   // form.clearError()  → clear serverError
 *   // Everything else is standard Formik
 */

import { useFormik, FormikConfig, FormikValues } from 'formik';
import { useState } from 'react';

type Config<T extends FormikValues> = Omit<FormikConfig<T>, 'onSubmit'> & {
  onSubmit: (values: T) => Promise<void>;
};

export function useAppFormik<T extends FormikValues>({ onSubmit, ...config }: Config<T>) {
  const [serverError, setServerError] = useState<string | null>(null);

  const formik = useFormik<T>({
    ...config,
    onSubmit: async (values, helpers) => {
      setServerError(null);
      try {
        await onSubmit(values);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Something went wrong. Please try again.';
        setServerError(message);
        helpers.setSubmitting(false);
      }
    },
  });

  return {
    ...formik,
    serverError,
    clearError: () => setServerError(null),
  };
}
