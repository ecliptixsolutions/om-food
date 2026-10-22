import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown } from "lucide-react";
import { supportedLanguages, useLanguage, type Language } from "@/lib/i18n";

export const languages = [
  { code: "nl", name: "Dutch", nativeName: "Nederlands", flag: "nl" },
  { code: "en", name: "English", nativeName: "English", flag: "gb" },
  { code: "fr", name: "French", nativeName: "Français", flag: "fr" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "de" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "es" },
  { code: "ru", name: "Russian", nativeName: "Русский", flag: "ru" },
] as const;
export function LanguageSelector() {
  const { language: code, setLanguage } = useLanguage();
  const selected = languages.find(language => language.code === code) ?? languages[1];
  function select(value: string) { if (supportedLanguages.includes(value as Language)) setLanguage(value as Language); }
  return <div className="language-selector">
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger className="language-trigger" aria-label={`${selected.name}`}>
        {selected.name}<ChevronDown aria-hidden="true" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="language-menu" align="end" sideOffset={8} collisionPadding={12} aria-label="Language preference">
          <DropdownMenu.RadioGroup value={code} onValueChange={select}>
            {languages.map(language => <DropdownMenu.RadioItem className="language-option" value={language.code} key={language.code} textValue={`${language.name} ${language.nativeName}`}>
              <img src={`/flags/${language.flag}.svg`} alt="" width="24" height="16" />
              <span>{language.name}<small lang={language.code}>{language.nativeName}</small></span>
              <DropdownMenu.ItemIndicator className="language-selected"><Check aria-hidden="true" /></DropdownMenu.ItemIndicator>
            </DropdownMenu.RadioItem>)}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  </div>;
}
