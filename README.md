# Airlines-Company

Airlines Company: Core Database Architecture &amp; Design

## O objetivo do PF

Demonstrar a arquitetura completa do sistema:
- Front-end;
- Back-end/API;
- SGBD PostgreSQL;
- Integração funcional entre essas camadas.

---

### OBS: 
Os componentes da arquitetura podem estar implementados em tecnologias separadas ou em uma mesma plataforma/framework, desde que a equipe mostre, na demonstração, qual parte corresponde ao front-end, qual parte corresponde ao back-end/API e como o back-end/API se conecta ao PostgreSQL.

### OBS2: 
A equipe deverá demonstrar, pela interface da aplicação, todas as funcionalidades mínimas exigidas.
Em cada funcionalidade demonstrada, deverá ficar claro que a operação é processada pelo back-end/API e executada sobre o banco PostgreSQL, conforme as etapas seguintes:
1.  Ação realizada no front-end;
2.  Processamento pelo back-end/API;
3.  Operação correspondente no PostgreSQL;
4.  Retorno do resultado para a aplicação;
5.  Comprovação, no console SQL ou ferramenta equivalente, da operação realizada no banco.

### OBS3:

A aplicação deverá permitir demonstrar, pela interface do sistema, operações coerentes com o domínio escolhido, incluindo:
- Inserção de registro;
- Atualização de registro;
- Remoção de registro;
- Listagem de registros;
- Consulta de registro específico;
- Busca por substring em campo textual;
- Operação composta envolvendo múltiplos registros;
- Tela, relatório ou consulta funcional com JOIN;
- Tela, relatório ou consulta funcional com GROUP BY e função de agregação;
- Tela, relatório ou consulta funcional com HAVING;
- Operação da aplicação que acione o gatilho implementado no PostgreSQL;
- Tratamento de pelo menos um erro de integridade gerado pelo banco.

### Requisitos técnicos mínimos.
A aplicação deve:
- conectar-se ao PostgreSQL como SGBD da aplicação;
- realizar o acesso ao PostgreSQL por meio do back-end/API;
- utilizar o modelo físico implementado no TP3, com os ajustes necessários à versão final.

### Critérios de avaliação:
- funcionamento da aplicação conectando front-end, back-end/API e PostgreSQL;
- funcionamento das funcionalidades mínimas exigidas;
- integração das funcionalidades mínimas ao domínio da aplicação;
- compatibilidade da aplicação com o banco desenvolvido nos TPs;
- clareza da demonstração e da explicação técnica da equipe.