import axios from 'axios';

// Configurações do n8n
const N8N_BASE_URL = process.env.N8N_URL || 'https://n8n.suaempresa.com.br/api/v1';
const N8N_API_KEY = process.env.N8N_API_KEY || '';

const n8nClient = axios.create({
  baseURL: N8N_BASE_URL,
  headers: {
    'X-N8N-API-KEY': N8N_API_KEY,
    'Content-Type': 'application/json',
  },
});

export const n8nService = {
  /**
   * Clona um workflow padrão do n8n e atribui à nova clínica.
   * @param templateWorkflowId ID do Workflow de Template
   * @param clinicName Nome da Clínica para renomear o novo workflow
   * @returns O ID do novo workflow criado
   */
  async cloneWorkflow(templateWorkflowId: string, clinicName: string): Promise<string | null> {
    try {
      if (!N8N_API_KEY) {
         console.warn("A chave da API do n8n não está configurada no arquivo .env");
         return "mock-workflow-id-" + Date.now();
      }

      console.log("Chamando GET no n8n para pegar template:", `/workflows/${templateWorkflowId}`);
      // 1. Pega os dados do workflow template
      const { data: templateData } = await n8nClient.get(`/workflows/${templateWorkflowId}`);
      console.log("Template retornado com sucesso. Quantidade de nós:", templateData?.nodes?.length);
      
      // 2. Prepara o novo workflow com o nome da clínica
      const newWorkflowPayload = {
        name: `Atendimento IA - ${clinicName}`,
        nodes: templateData.nodes,
        connections: templateData.connections,
        settings: {},
      };

      console.log("Chamando POST no n8n para criar novo workflow...");
      // 3. Cria o novo workflow
      const { data: newWorkflow } = await n8nClient.post('/workflows', newWorkflowPayload);
      console.log("Workflow criado no n8n com sucesso! Novo ID:", newWorkflow?.id);
      
      return newWorkflow.id;
    } catch (error: any) {
      console.error('Erro detalhado ao clonar workflow no n8n:', error?.response?.data || error.message);
      return null;
    }
  },

  /**
   * Gera a chave dinâmica de sessão do Redis (Memory)
   * Formato exigido para isolar a memória por clínica e paciente:
   * "clinic_{id_clinica}_session_{numero_cliente}"
   */
  generateRedisSessionId(clinicId: string, clientPhoneNumber: string): string {
    return `clinic_${clinicId}_session_${clientPhoneNumber}`;
  }
};
