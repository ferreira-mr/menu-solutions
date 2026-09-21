<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#000000">
    <meta name="description" content="Menu Solutions">
    <link rel="icon" href="{{ asset('favicon.png') }}">
    <link rel="apple-touch-icon" href="{{ asset('logo192.png') }}">
    <link rel="manifest" href="{{ asset('manifest.json') }}">
    <title>Menu Solutions</title>

    @env('local')
        @viteReactRefresh
    @endenv
    @vite(['resources/css/app.css', 'resources/js/main.jsx'])
</head>
<body>
    <noscript>É necessário habilitar JavaScript para usar esta aplicação.</noscript>
    <div id="root"></div>
</body>
</html>
