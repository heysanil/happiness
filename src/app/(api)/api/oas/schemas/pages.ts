import type { SchemaObject } from 'openapi3-ts/oas30';
import { Prefixes } from 'src/util/generateID';
import { HappinessConfig } from 'happiness.config';
import { timestamps } from '@docs/oas/schemas/timestamps';
import { id } from '@docs/oas/schemas/id';
import { alwaysRequired } from '@docs/oas/shared/alwaysRequired';

export const PageProperties = (
    /** Set `false` for creates or updates, to exclude fields like `id` and timestamps. */
    readOnly = false,
): SchemaObject['properties'] => ({
    ...readOnly ? id(Prefixes.Page) : {},
    slug: {
        type: 'string',
        description: 'The slug of the page, used in the URL.',
        example: 'hackplus',
        maxLength: 255,
    },
    kind: {
        type: 'string',
        enum: ['simple', 'story'],
        description: 'The format of the page.',
        example: 'story',
    },
    name: {
        type: 'string',
        description: 'The internal name of the page, used internally to describe it.',
        example: 'Hack+ General Donations',
        maxLength: 255,
    },
    organizer: {
        type: 'string',
        description: 'The name of the organizer of the page. This can be an individual, group, or any other entity.',
        example: 'Sanil Chawla',
        maxLength: 255,
    },
    fsProject: {
        type: 'string',
        description: "If this is a fiscally-sponsored project, the project's name.",
        nullable: true,
        example: 'Slingshot Giving',
        maxLength: 255,
    },
    title: {
        type: 'string',
        description: 'The public title of the page, used in the page header.',
        example: 'Donate to Hack+',
        maxLength: 255,
    },
    subtitle: {
        type: 'string',
        description: 'The public subtitle of the page, used in the page header.',
        nullable: true,
        example: 'Help young people everywhere launch impactful projects to help the world around them.',
        maxLength: 255,
    },
    story: {
        type: 'string',
        description: 'The story of the page, presented below the banner in `story` pages. This text will be formatted as Markdown and should be presented using a Markdown renderer. Only available in `story` pages.',
        nullable: true,
        example: '[Hack+](https://hackplus.io) builds infrastructure to help **thousands of young people** launch charitable projects for causes that matter to their community and the world at large.',
    },
    bannerType: {
        type: 'string',
        enum: ['image', 'embed'],
        description: 'The type of banner to display on the page. Only available in `story` pages.',
        nullable: true,
        example: 'image',
    },
    bannerURL: {
        type: 'string',
        format: 'uri',
        description: 'The URL of the banner to display on the page. This will be either an image URL or an `iframe` embeddable URL, depending on the value of `bannerType`. Only available in `story` pages.',
        nullable: true,
        example: 'https://fast.slingshot.fm/sling/static/og.jpg',
    },
    raised: {
        type: 'number',
        description: 'The amount the page has raised, in cents. Only present in `story` pages.',
        example: 100000,
        nullable: true,
    },
    goal: {
        type: 'number',
        description: 'The goal amount of the page, in cents. Only present in `story` pages.',
        example: 100000,
        nullable: true,
    },
    currency: {
        type: 'string',
        description: 'The currency of the goal & raised amounts of the page. Only USD is supported at this time, but other currencies may be supported in a future update.',
        enum: ['usd'],
        nullable: true,
    },
    ...readOnly ? timestamps : {},
});

export const PageSchema = (
    /** Set `false` for creates or updates, to exclude fields like `id` and timestamps. */
    readOnly = false,
    /** Set `true` to make all fields optional; especially useful for update scenarios. */
    allFieldsOptional = false,
): SchemaObject => ({
    type: 'object',
    description: `Pages represent a donation page on ${HappinessConfig.name}. Each page can represent an organization, campaign, project, event, or any other entity raising funds.`,
    properties: PageProperties(readOnly),
    ...allFieldsOptional ? { required: ['id'] } : { required: [...alwaysRequired, 'slug', 'kind', 'name', 'title'] },
});
