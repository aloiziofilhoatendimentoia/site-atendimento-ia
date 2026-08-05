const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4ZTY1YzYyNi1jYjE4LTQ3NjMtOWYwOC1kNzkyYmRhMGFkNDEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYjA5Yjc1ZTAtY2QyNS00YTc4LWE2YWQtOTJhMmVlNGU4MGVkIiwiaWF0IjoxNzg0MDA0OTk2fQ.X53Lx3__CnG9iaeqsyNvb5lHEukiy_uyQw9bpaG_YIA';

async function runDefinitiveFix() {
  const workflowIds = ['8P6rcD7M9QvYG7jg', 'OLsd2Rtp3wQ3gHeB'];

  for (const id of workflowIds) {
    const res = await fetch(`https://n8n.atendimentoiaclinicas.tech/api/v1/workflows/${id}`, {
      headers: { 'X-N8N-API-KEY': API_KEY }
    });
    if (!res.ok) continue;
    const wf = await res.json();
    
    // 1. Atualizar nó Filtro para filtrar mensagens da própria API ou updates de entrega
    const filtroNode = wf.nodes.find(n => n.name === 'Filtro');
    if (filtroNode) {
      filtroNode.parameters = {
        conditions: {
          options: {
            caseSensitive: true,
            leftValue: "",
            typeValidation: "strict",
            version: 3
          },
          conditions: [
            {
              id: "evt-upsert-only",
              leftValue: "={{ $json.body.event || 'messages.upsert' }}",
              rightValue: "messages.upsert",
              operator: {
                type: "string",
                operation: "equals"
              }
            },
            {
              id: "from-me-false-only",
              leftValue: "={{ $json.body.data?.key?.fromMe !== undefined ? $json.body.data.key.fromMe : ($json.body.fromMe !== undefined ? $json.body.fromMe : false) }}",
              rightValue: "",
              operator: {
                type: "boolean",
                operation: "false",
                singleValue: true
              }
            },
            {
              id: "is-edit-false",
              leftValue: "={{ $json.body.isEdit || false }}",
              rightValue: "",
              operator: {
                type: "boolean",
                operation: "false",
                singleValue: true
              }
            },
            {
              id: "is-group-false",
              leftValue: "={{ $json.body.isGroup || false }}",
              rightValue: "",
              operator: {
                type: "boolean",
                operation: "false",
                singleValue: true
              }
            }
          ],
          combinator: "and"
        },
        options: {}
      };
    }

    // 2. No workflow 8P6rcD7M9QvYG7jg, configurar o nó Supabase com parâmetros válidos
    if (id === '8P6rcD7M9QvYG7jg') {
      const siteNodeIndex = wf.nodes.findIndex(n => n.name === 'Salvar Cliente Site Supabase');
      const siteNode = {
        parameters: {
          tableId: "CLIENTES ATENDIMENTO IA SITE",
          fieldsUi: {
            fieldValues: [
              {
                fieldId: "nome_clinica",
                fieldValue: "={{ $json.body.nome_da_clinica || $json.body.clinica?.nomeClinica }}"
              },
              {
                fieldId: "telefone_principal",
                fieldValue: "={{ $json.body.whatsapp_ia || $json.body.clinica?.whatsappClinica }}"
              },
              {
                fieldId: "endereco",
                fieldValue: "={{ $json.body.clinica?.endereco || $json.body.endereco || 'Não informado' }}"
              },
              {
                fieldId: "especialistas",
                fieldValue: "={{ $json.body.profissionais_formatados }}"
              },
              {
                fieldId: "canais_escolhidos",
                fieldValue: "={{ $json.body.canais_escolhidos }}"
              }
            ]
          }
        },
        id: "salvar-site-supabase-node",
        name: "Salvar Cliente Site Supabase",
        type: "n8n-nodes-base.supabase",
        typeVersion: 1,
        position: [780, 240],
        credentials: {
          supabaseApi: {
            id: "NG8ygbdX5rmb1ONX",
            name: "Supabase account"
          }
        }
      };

      if (siteNodeIndex >= 0) {
        wf.nodes[siteNodeIndex] = siteNode;
      } else {
        wf.nodes.push(siteNode);
        if (wf.connections['Webhook Config Site'] && wf.connections['Webhook Config Site'].main) {
          wf.connections['Webhook Config Site'].main[0].push({
            node: "Salvar Cliente Site Supabase",
            type: "main",
            index: 0
          });
        }
      }
    }

    const updateRes = await fetch(`https://n8n.atendimentoiaclinicas.tech/api/v1/workflows/${id}`, {
      method: 'PUT',
      headers: {
        'X-N8N-API-KEY': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: wf.name,
        nodes: wf.nodes,
        connections: wf.connections,
        settings: { executionOrder: 'v1' }
      })
    });

    console.log(`Updated workflow ${id} status:`, updateRes.status);
  }
}

runDefinitiveFix().catch(console.error);
