abstract class Veiculo {
    private final String modelo;

    protected Veiculo(String modelo) {
        this.modelo = modelo;
    }

    public String getModelo() {
        return modelo;
    }

    public abstract void acelerar();
}

class Carro extends Veiculo {
    private int marcha = 1;

    public Carro(String modelo) {
        super(modelo);
    }

    @Override
    public void acelerar() {
        if (marcha < 6) {
            marcha++;
        }
        System.out.println("O carro " + getModelo() + " acelera para a marcha " + marcha + " e aumenta a velocidade de forma suave.");
    }
}

class Moto extends Veiculo {
    private int rpm = 2000;

    public Moto(String modelo) {
        super(modelo);
    }

    @Override
    public void acelerar() {
        rpm += 1500;
        System.out.println("A moto " + getModelo() + " gira o acelerador e sobe para " + rpm + " RPM rapidamente.");
    }
}

public class VeiculosDemo {
    public static void main(String[] args) {
        Veiculo carro = new Carro("Sedan LX");
        Veiculo moto = new Moto("Street 500");

        carro.acelerar();
        moto.acelerar();

        System.out.println("Este exemplo mostra polimorfismo porque a mesma referência do tipo Veiculo\n" +
                "invoca implementações diferentes de acelerar() em Carro e Moto.");
    }
}
