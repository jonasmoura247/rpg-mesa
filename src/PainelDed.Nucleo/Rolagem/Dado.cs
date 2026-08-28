using System;
using System.Text.RegularExpressions;

namespace PainelDed.Nucleo.Rolagem;

public class Dado : IDado
{
    private static readonly Regex RegexNotacao = new(@"^(?<quantidade>\d+)d(?<lados>\d+)$", RegexOptions.Compiled);
    private readonly Random _aleatorio;

    public Dado(Random? aleatorio = null)
    {
        _aleatorio = aleatorio ?? new Random();
    }

    public int Rolar(string notacao)
    {
        var (quantidade, lados) = ParsearNotacao(notacao);
        var total = 0;
        for (var i = 0; i < quantidade; i++)
        {
            total += _aleatorio.Next(1, lados + 1);
        }
        return total;
    }

    public static (int Quantidade, int Lados) ParsearNotacao(string notacao)
    {
        if (string.IsNullOrWhiteSpace(notacao))
        {
            throw new ArgumentException("Notação de dado não pode ser vazia.");
        }

        var match = RegexNotacao.Match(notacao.Trim().ToLowerInvariant());
        if (!match.Success)
        {
            throw new ArgumentException($"Notação de dado inválida: '{notacao}'. Formato esperado: 'NdM', ex: '1d20'.");
        }

        var quantidade = int.Parse(match.Groups["quantidade"].Value);
        var lados = int.Parse(match.Groups["lados"].Value);

        if (quantidade < 1)
        {
            throw new ArgumentException($"Quantidade de dados deve ser ao menos 1 em '{notacao}'.");
        }

        if (lados < 2)
        {
            throw new ArgumentException($"Número de lados deve ser ao menos 2 em '{notacao}'.");
        }

        return (quantidade, lados);
    }
}
