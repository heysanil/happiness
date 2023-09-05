'use client';

import type { FC } from 'react';
import { Text } from 'paris/text';
import { useMemo } from 'react';

export type ButtonGroupOption = { id: string, name: string };

export type ButtonGroupProps = {
    /** The options to display in the ButtonGroup. */
    options: ButtonGroupOption[];
    /** The ID of the selected option. */
    selected: string;
    /** A callback that fires when the selected option changes. */
    onChange: (option: ButtonGroupOption) => void | Promise<void>;
};

export const ButtonGroup: FC<ButtonGroupProps> = ({
    options,
    selected,
    onChange,
}) => {
    const selectedIndex = useMemo(() => (
        options.findIndex((option) => option.id === selected)
    ), [options, selected]);

    return (
        <div className="relative flex p-1 py-2.5 space-x-1 bg-gray-200/50 rounded-full focus-within:outline-none focus-within:ring-1 focus-within:ring-offset-2 focus-within:ring-neutral-400">
            <div
                className="absolute m-[4px] left-0 inset-y-0 w-1/3 flex bg-white transition-all ease-in-out duration-200 transform rounded-full shadow"
                style={{
                    width: `calc(100% / ${options.length})`,
                    transform: `translateX(calc(${selectedIndex * 100}% - ${selectedIndex > 0 ? 8 : 0}px))`,
                }}
            />
            {options.map((option, index) => (
                <button
                    key={option.id}
                    type="button"
                    onClick={() => onChange?.(option)}
                    className="relative flex-1 flex text-xs sm:text-sm capitalize items-center justify-center m-px p-px focus-within:outline-none rounded-full"
                >
                    <Text kind="labelSmall" style={{ fontWeight: index === selectedIndex ? 600 : 400 }}>
                        {option.name}
                    </Text>
                </button>
            ))}
        </div>
    );
};
