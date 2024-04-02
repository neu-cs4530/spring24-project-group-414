import React, { ChangeEventHandler, ReactEventHandler } from 'react';

export function TextBox(props: {
  value?: string;
  handleChange?: ChangeEventHandler;
  handleSubmit?: ReactEventHandler;
}): JSX.Element {
  return (
    <form onSubmit={props.handleSubmit}>
      <input value={props.value} onChange={props.handleChange} maxLength={20} minLength={3} />
    </form>
  );
}
