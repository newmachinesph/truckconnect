"use client"

import { Listbox, ListboxButton, ListboxOption, ListboxOptions, Transition } from "@headlessui/react"
import { ChevronUpDownIcon, CheckIcon } from "@heroicons/react/24/outline"
import { Fragment } from "react"
import { cn } from "@/lib/utils"

interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  label?: string
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  error?: string
}

export function Select({ label, value, onChange, options, placeholder = "Select...", error }: SelectProps) {
  const selected = options.find((o) => o.value === value)

  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-gray-900">{label}</label>}
      <Listbox value={value} onChange={onChange}>
        <div className="relative">
          <ListboxButton
            className={cn(
              "relative w-full cursor-pointer rounded-md bg-white py-2.5 pl-3.5 pr-10 text-left text-sm shadow-sm ring-1 ring-inset transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-inset",
              error
                ? "ring-red-300 focus:ring-red-500"
                : "ring-gray-300 focus:ring-indigo-600"
            )}
          >
            <span className={cn("block truncate", !selected && "text-gray-400")}>
              {selected?.label || placeholder}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <ChevronUpDownIcon className="h-5 w-5 text-gray-400" />
            </span>
          </ListboxButton>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-gray-200 focus:outline-none">
              {options.map((option) => (
                <ListboxOption
                  key={option.value}
                  value={option.value}
                  className={({ active }) =>
                    cn(
                      "relative cursor-pointer select-none py-2 pl-3.5 pr-4",
                      active ? "bg-indigo-50 text-indigo-600" : "text-gray-900"
                    )
                  }
                >
                  {({ selected: isSelected }) => (
                    <>
                      <span className={cn("block truncate", isSelected && "font-semibold")}>
                        {option.label}
                      </span>
                      {isSelected && (
                        <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-indigo-600">
                          <CheckIcon className="h-4 w-4" />
                        </span>
                      )}
                    </>
                  )}
                </ListboxOption>
              ))}
            </ListboxOptions>
          </Transition>
        </div>
      </Listbox>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
