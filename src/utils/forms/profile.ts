import type { CityValue } from "@/utils/address/cities";
import type { FieldSpec } from "@/utils/forms/problems";

export const PROFILE_IDS = {
  name: "profile-name",
  phone: "profile-phone",
  city: "profile-city",
} as const;

export function profileFieldSpecs(
  name: (key: string) => string,
  values: {
    city: CityValue;
    withName: boolean;
    nameValue?: string;
    phoneValue?: string;
  },
): FieldSpec[] {
  return [
    ...(values.withName
      ? [
          {
            key: "name",
            name: name("name"),
            target: PROFILE_IDS.name,
            empty: !values.nameValue?.trim(),
          },
        ]
      : []),
    ...(values.phoneValue !== undefined
      ? [
          {
            key: "phone",
            name: name("phone"),
            target: PROFILE_IDS.phone,
            empty: !values.phoneValue,
          },
        ]
      : []),
    {
      key: "city",
      name: name("city"),
      target: PROFILE_IDS.city,
      empty: !values.city.city.trim(),
    },
  ];
}
