import * as React from 'react';
import { Switch, Route } from 'react-router-dom';
import { RouteComponentProps } from 'react-router';

import {
    SideBarView,
    Icon,
    Button,
} from 'components';

import List, { ListItem } from 'components/List';

import PortalManager from 'components/PortalManager';

import ModalPortal, {
    ModalWindow,
    ModalHeader,
    ModalContent,
    ModalFooter,
} from 'components/PortalManager/ModalPortal';

import { ContentView } from 'components/View';

import ActivitiesView from './routes/Activities';
import InvitesView from './routes/Invites';
import RecommendationsView from './routes/Recommendations';

import { SideBar, ConversationUpdates } from './implementations';
import translate from 'utils/translate';

import Form, {
    FieldCollection,
    FieldSet,
    Label,
    Input,
} from 'components/Form';

interface Props extends RouteComponentProps<any> {}

export default class Dashboard extends React.Component<Props, {}> {

    render() {
        const { match , history, location } = this.props;

        return (
            <SideBarView
                sidebar={
                    <SideBar
                        baseUrl={'/home'}
                        navigator={{match, history, location}}
                    />
                }>
                <Switch>
                    <Route path={`${match.url}/activities`} component={ActivitiesView} />
                    <Route path={`${match.url}/invites`} component={InvitesView} />
                    <Route path={`${match.url}/recommendations`} component={RecommendationsView} />

                    <Route exact path={`${match.url}`} render={this.renderMaster} />
                </Switch>
            </SideBarView>
        );
    }

    private renderMaster = () => {
        return (
            <ContentView>
                <PortalManager
                    renderHandler={(open) => (
                        <Button
                            onClick={open}
                            leftChild={<Icon name={'message'} />}>
                            {translate('pur-dashboard-conversations-button-new-message')}
                        </Button>
                    )}
                    renderPortal={(close) => (
                        <ModalPortal onBackgroundClick={close}>
                            <Form onSubmit={(e: any, fields: any) => console.log(fields)}>
                                <ModalWindow>
                                    <ModalHeader
                                        onClose={close}
                                        title={'Plaats een nieuw bericht'} />
                                    <ModalContent>
                                        <FieldCollection>
                                            <FieldSet>
                                                <Label label={'Field label'}>
                                                    <Input type={'text'} name={'fieldname'} />
                                                </Label>
                                            </FieldSet>
                                        </FieldCollection>
                                    </ModalContent>
                                    <ModalFooter>
                                        <List horizontal>
                                            <ListItem alignRight>
                                                <Button type={'button'} onClick={close}>Annuleren</Button>
                                            </ListItem>
                                            <ListItem alignRight>
                                                <Button type={'submit'}>Plaats bericht</Button>
                                            </ListItem>
                                        </List>
                                    </ModalFooter>
                                </ModalWindow>
                            </Form>
                        </ModalPortal>
                    )}
                />
                <ConversationUpdates />
            </ContentView>
        );
    }
}
