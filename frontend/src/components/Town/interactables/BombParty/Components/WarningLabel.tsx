import React from 'react';

export default function WarningLabel(props: { children: string }) {
  return <label> {props.children} </label>;
}
