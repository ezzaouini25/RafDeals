'use client';

import { useState, Fragment } from 'react';
import { Combobox, Transition } from '@headlessui/react';
import Flag from '@/components/ui/Flag';
import { Countries } from 'countries-states-cities-service/countries';
import { Check, ChevronsUpDown, Search, X } from 'lucide-react';

const ALL_COUNTRIES = Countries.getCountries();

interface CountrySelectProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export default function CountrySelect({ value, onChange }: CountrySelectProps) {
  const [query, setQuery] = useState('');

  const filteredCountries =
    query === ''
      ? ALL_COUNTRIES
      : ALL_COUNTRIES.filter((country) =>
          country.name.toLowerCase().includes(query.toLowerCase())
        );

  const handleRemove = (codeToRemove: string) => {
    onChange(value.filter((code) => code !== codeToRemove));
  };

  return (
    <div className="w-full">
      <Combobox value={value} onChange={onChange} multiple>
        <div className="relative mt-1">
          {/* Selected items display */}
          <div className="flex flex-wrap gap-2 mb-2">
            {value.map((code) => {
              const country = ALL_COUNTRIES.find((c) => c.iso2 === code);
              if (!country) return null;
              return (
                <span
                  key={code}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-white text-xs font-bold rounded-md border border-slate-200 dark:border-white/10"
                >
                  <Flag country={code as any} width={16} />
                  {country.name}
                  <button
                    type="button"
                    onClick={() => handleRemove(code)}
                    className="ml-1 text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </span>
              );
            })}
          </div>

          {/* Input area */}
          <div className="relative w-full cursor-default overflow-hidden rounded-md bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-left focus-within:border-yellow focus-within:ring-1 focus-within:ring-yellow transition-colors">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Combobox.Input
              className="w-full border-none py-2.5 pl-10 pr-10 text-sm leading-5 text-slate-900 dark:text-white bg-transparent focus:ring-0 outline-none placeholder:text-slate-400"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search countries..."
            />
            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronsUpDown className="h-4 w-4 text-slate-400" aria-hidden="true" />
            </Combobox.Button>
          </div>

          {/* Dropdown options */}
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            afterLeave={() => setQuery('')}
          >
            <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-slate-900 py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm z-50 border border-slate-200 dark:border-white/10">
              {filteredCountries.length === 0 && query !== '' ? (
                <div className="relative cursor-default select-none py-2 px-4 text-slate-500">
                  Nothing found.
                </div>
              ) : (
                filteredCountries.map((country) => (
                  <Combobox.Option
                    key={country.iso2}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2.5 pl-10 pr-4 ${
                        active ? 'bg-yellow/10 text-yellow' : 'text-slate-900 dark:text-white'
                      }`
                    }
                    value={country.iso2}
                  >
                    {({ selected, active }) => (
                      <>
                        <div className="flex items-center gap-3">
                          <Flag country={country.iso2 as any} width={20} />
                          <span className={`block truncate ${selected ? 'font-bold' : 'font-normal'}`}>
                            {country.name}
                          </span>
                        </div>
                        {selected ? (
                          <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-yellow' : 'text-yellow'}`}>
                            <Check className="h-4 w-4" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Combobox.Option>
                ))
              )}
            </Combobox.Options>
          </Transition>
        </div>
      </Combobox>
    </div>
  );
}