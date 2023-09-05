type IncludeValue = boolean | string[];

interface ParsedParameters {
    select?: boolean | string[];
    include?: {
        [key: string]: IncludeValue;
    };
}

export const parseQueryString = (queryString: string | URLSearchParams): ParsedParameters => {
    const result: ParsedParameters = {};

    if (!queryString) {
        return result;
    }

    const params = (queryString instanceof URLSearchParams) ? queryString : new URLSearchParams(queryString);

    result.select = true;
    if (params.has('select')) {
        const selectValue = params.get('select');
        if (selectValue) {
            result.select = selectValue === 'true' ? true : selectValue.split(',');
        }
    }

    if (params.has('include')) {
        result.include = {};
        const includeValue = params.get('include');
        let includeParts: string[] = [];
        if (includeValue) {
            includeParts = includeValue.split(',');
        }

        includeParts.forEach((part) => {
            const match = part.match(/(\w+)\[(.+)\]/);
            if (match) {
                const [, key, value] = match;
                result.include![key] = value.split('|');
            } else {
                result.include![part] = true;
            }
        });
    }

    return result;
};
