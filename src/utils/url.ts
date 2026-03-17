export const getURL = () => {
    let url =
        process?.env?.NEXT_PUBLIC_SITE_URL ?? // Set this to your site URL in production env.
        process?.env?.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ?? // Vercel system production URL.
        process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel if explicitly exposed.
        process?.env?.VERCEL_URL ?? // Automatically set by Vercel on the Server.
        'http://localhost:3000'

    // If running in the browser, always use the current origin
    if (typeof window !== 'undefined') {
        url = window.location.origin
    }

    // Make sure to include `https://` when not localhost.
    url = url.startsWith('http') ? url : `https://${url}`

    // Make sure to include a trailing `/`.
    url = url.endsWith('/') ? url : `${url}/`

    return url
}
