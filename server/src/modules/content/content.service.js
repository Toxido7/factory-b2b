import { ApiError } from '../../utils/ApiError.js';
import { CONTENT_FIELDS, FIELD_BY_KEY, checkValue } from './content.fields.js';
import * as contentRepository from './content.repository.js';

const toValueMap = (rows) => Object.fromEntries(rows.map(({ key, value }) => [key, value]));

export const listPublic = async () => ({
  content: toValueMap(await contentRepository.findAll()),
});

export const listAdmin = async () => {
  const values = toValueMap(await contentRepository.findAll());
  return {
    fields: CONTENT_FIELDS.map((field) => ({
      ...field,
      value: values[field.key] ?? null,
    })),
  };
};

export const update = async (values) => {
  const changes = {};
  const details = {};

  for (const [key, rawValue] of Object.entries(values)) {
    const field = FIELD_BY_KEY.get(key);
    if (!field) {
      details[key] = 'Unknown content field';
      continue;
    }

    const value = rawValue.trim();
    const error = checkValue(field, value);
    if (error) {
      details[key] = error;
      continue;
    }
    changes[key] = value;
  }

  if (Object.keys(details).length > 0) {
    throw ApiError.badRequest('Validation failed', details);
  }

  await contentRepository.applyChanges(changes);
  return listAdmin();
};
