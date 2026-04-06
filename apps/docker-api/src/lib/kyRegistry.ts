import ky from 'ky';

export const kyRegistry = ky.create({
    timeout: 5000,
    hooks: {
        afterResponse: [
            (request, _options, response) => {
                if (response.status === 401) {
                    const serveraddress = new URL(request.url).host;
                    throw new Error(`Authentication failed for registry ${serveraddress}`);
                }
            },
        ],
    },
});
