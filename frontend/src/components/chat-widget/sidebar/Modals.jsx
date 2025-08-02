/* eslint-disable react/prop-types */
import React from 'react';
import CharacterGenerator from '../../CharacterGenerator';
import CreateProjectModal from '../modals/CreateProjectModal';
import ImagePreviewModal from '../modals/ImagePreviewModal';
import RedoGenerationModal from '../modals/RedoGenerationModal';

const Modals = ({
  showCharacterGenerator,
  setShowCharacterGenerator,
  createModalOpen,
  closeCreateModal,
  handleCreateProjectModal,
  creatingProject,
  createProjectError,
  newProjectName,
  setNewProjectName,
  newProjectDesc,
  setNewProjectDesc,
  nameInputRef,
  showImageModal,
  modalImageUrl,
  setShowImageModal,
  setModalImageUrl,
  showRedoModal,
  redoStepId,
  redoImageModel,
  setRedoImageModel,
  redoVideoModel,
  setRedoVideoModel,
  loading,
  setShowRedoModal,
  handleRedoWithModel,
}) => {
  return (
    <>
      <CharacterGenerator
        isOpen={showCharacterGenerator}
        onClose={() => setShowCharacterGenerator(false)}
      />
      <CreateProjectModal
        isOpen={createModalOpen}
        onClose={closeCreateModal}
        onSubmit={handleCreateProjectModal}
        creatingProject={creatingProject}
        createProjectError={createProjectError}
        newProjectName={newProjectName}
        setNewProjectName={setNewProjectName}
        newProjectDesc={newProjectDesc}
        setNewProjectDesc={setNewProjectDesc}
        nameInputRef={nameInputRef}
      />
      <ImagePreviewModal
        isOpen={showImageModal}
        imageUrl={modalImageUrl}
        onClose={() => {
          setShowImageModal(false);
          setModalImageUrl(null);
        }}
      />
      <RedoGenerationModal
        isOpen={showRedoModal}
        stepId={redoStepId}
        redoImageModel={redoImageModel}
        setRedoImageModel={setRedoImageModel}
        redoVideoModel={redoVideoModel}
        setRedoVideoModel={setRedoVideoModel}
        loading={loading}
        onCancel={() => setShowRedoModal(false)}
        onConfirm={handleRedoWithModel}
      />
    </>
  );
};

export default Modals;
