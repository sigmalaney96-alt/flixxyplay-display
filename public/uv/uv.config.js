/*global Ultraviolet*/
self.__uv$config = {
    prefix: "/b/",
    bare: "/b/",
    encodeUrl: Ultraviolet.codec.xor.encode,
    decodeUrl: Ultraviolet.codec.xor.decode,
    handler: "/uv/uv.handler.js",
    client: "/uv/uv.client.js",
    bundle: "/uv/uv.bundle.js",
    config: "/uv/uv.config.js",
    sw: "/uv/uv.sw.js",
    transport: 'ws',
    connection: {
        secure: false,
        local: false,
    }
};
