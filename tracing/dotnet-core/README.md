### Bibloteca de propaga��o de header Charles - Zup
Biblioteca simples para propaga�ao do "header" de tracing do "Charles".

#### Como iniciar
Primeiro importe biblioteca em sua aplica��o:

```csharp
using Zup.Tracing;
```

Posteriormente no m�todo `ConfigureServices` da classe `Startup` diga ao pipeline do asp.net que iremos usar a propaga��o de "headers" necess�rios para o fucionamento do "Charles" adicionando a lina abaixo:

```csharp
public void ConfigureServices(IServiceCollection services)
{
    ...
    services.AddCharles();
    ...
}
```
Entao em sua aplica��o basta usar normalmente o a sua classe `HttpClient` a partir da inje��o de depend�ncia da interface `IHttpClientFactory`:

```csharp
[Route("api/[controller]")]
[ApiController]
public class FooController : ControllerBase
{
    private readonly IHttpClientFactory _factory;
    public FooController(IHttpClientFactory factory)
    {
        _factory = factory;
    }
    ...
    [HttpPost]
    public async Task<IActionResult> Post()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("http://www.contoso.com/");
        return Ok();
    }
}
```

#### Configura�oes extras

Por padr�o qualquer objeto da classe `HttpClient` ir� repassar o "header" `x-circle-id` caso a requisi��o o receba, por�m � possivel trabalhar com clientes nomeados e/ou propagar mais "headers" usando as sobrecargas que fornecem op��es adicionais de configura��o do servi�o:

```csharp
public void ConfigureServices(IServiceCollection services)
{
    ...
    services.AddCharles("charlesClient", options =>
    {
        options.HeaderNames.Add("x-circle-id");
        options.HeaderNames.Add("x-another-header");
    });
}
```
� importante salientar que usando esta configura��o, � necess�rio adicionar o header `x-circle-id` novamente uma vez a op��o sobrescreve a configura��o padr�o.