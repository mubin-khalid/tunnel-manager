import {
  ConfirmModal,
  TunnelsAuthWarningCard,
  TunnelsEmptyState,
  TunnelsFormCard,
  TunnelsHeader,
  TunnelsList,
} from "@/components";
import { useTunnelForm } from "@/hooks/useTunnelForm";

export type TunnelsPageProps = {
  ngrokInstalled: boolean;
  hasAuthtoken: boolean;
  running: boolean;
  setRunning: (v: boolean) => void;
};

export default function TunnelsPage({ ngrokInstalled, hasAuthtoken, running, setRunning }: TunnelsPageProps) {
  const {
    definitions,
    form,
    setForm,
    editingName,
    showForm,
    saving,
    error,
    fieldErrors,
    saved,
    confirmRestartOpen,
    handleSubmit,
    handleEdit,
    handleDelete,
    handleCancel,
    confirmRestart,
    handleAdd,
    dismissRestartConfirm,
    canEdit,
    actionDisabled,
    pendingHasTunnels,
    tunnelList,
  } = useTunnelForm({ running, setRunning, ngrokInstalled, hasAuthtoken });

  return (
    <div className="w-full h-full p-8">
      <div className="max-w-3xl mx-auto">
        <TunnelsHeader
          showForm={showForm}
          saved={saved}
          canEdit={canEdit}
          ngrokInstalled={ngrokInstalled}
          actionDisabled={actionDisabled}
          onAdd={handleAdd}
        />
        {!canEdit && !showForm ? <TunnelsAuthWarningCard ngrokInstalled={ngrokInstalled} /> : null}

        <TunnelsFormCard
          showForm={showForm}
          editingName={editingName}
          form={form}
          error={error}
          fieldErrors={fieldErrors}
          saving={saving}
          actionDisabled={actionDisabled}
          onChange={setForm}
          onCancel={handleCancel}
          onSubmit={handleSubmit}
        />

        {tunnelList.length === 0 && !showForm ? <TunnelsEmptyState /> : null}

        {tunnelList.length > 0 ? (
          <TunnelsList
            tunnels={definitions}
            disabled={actionDisabled}
            running={running}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ) : null}

        <ConfirmModal
          open={confirmRestartOpen}
          danger
          title="Restart ngrok required"
          message={
            pendingHasTunnels ? (
              <>ngrok is currently running. Updating tunnels requires restarting ngrok, which will restart all tunnels.</>
            ) : (
              <>ngrok is currently running. Updating tunnels requires restarting ngrok, and since there will be no tunnels configured after this change, ngrok will be stopped.</>
            )
          }
          confirmText="Restart ngrok"
          cancelText="Keep running"
          isLoading={saving}
          onCancel={dismissRestartConfirm}
          onConfirm={confirmRestart}
        />
      </div>
    </div>
  );
}
